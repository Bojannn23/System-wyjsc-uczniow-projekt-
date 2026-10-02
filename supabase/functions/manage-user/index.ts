import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Niedozwolona metoda." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return jsonResponse({ error: "Brak aktywnej sesji." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error("Brakuje wymaganych sekretów funkcji manage-user.");
    return jsonResponse({ error: "Funkcja administracyjna nie jest skonfigurowana." }, 500);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return jsonResponse({ error: "Sesja jest nieprawidłowa lub wygasła." }, 401);

  const { data: manager, error: managerError } = await userClient
    .from("staff")
    .select("id, roles:role_id (name)")
    .eq("email", authData.user.email)
    .maybeSingle();
  if (managerError || manager?.roles?.name !== "dyrektor") {
    return jsonResponse({ error: "Tylko dyrektor może tworzyć konta." }, 403);
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "Nieprawidłowe dane formularza." }, 400);
  }

  const fullName = typeof input.full_name === "string" ? input.full_name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : null;
  const roleId = typeof input.role_id === "string" ? input.role_id : "";

  if (!fullName || !email || !roleId || password.length < 10) {
    return jsonResponse({ error: "Podaj poprawne dane i hasło zawierające co najmniej 10 znaków." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Podaj poprawny adres e-mail." }, 400);
  }

  const { data: role, error: roleError } = await adminClient
    .from("roles")
    .select("id, name")
    .eq("id", roleId)
    .maybeSingle();
  if (roleError || !role || !["nauczyciel", "pedagog", "dyrektor"].includes(role.name)) {
    return jsonResponse({ error: "Wybrana rola jest nieprawidłowa." }, 400);
  }

  const { data: existingStaff, error: existingStaffError } = await adminClient
    .from("staff")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (existingStaffError) return jsonResponse({ error: "Nie udało się sprawdzić pracownika." }, 500);
  if (existingStaff?.auth_user_id) return jsonResponse({ error: "Ten pracownik ma już konto logowania." }, 409);

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !createdUser.user) {
    return jsonResponse({ error: createError?.message || "Nie udało się utworzyć konta logowania." }, 400);
  }

  const staffQuery = existingStaff
    ? adminClient.from("staff").update({
      full_name: fullName,
      email,
      phone,
      role_id: roleId,
      auth_user_id: createdUser.user.id,
    }).eq("id", existingStaff.id)
    : adminClient.from("staff").insert({
      full_name: fullName,
      email,
      phone,
      role_id: roleId,
      auth_user_id: createdUser.user.id,
    });

  const { error: staffSaveError } = await staffQuery;
  if (staffSaveError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    console.error("Nie udało się połączyć konta Auth z pracownikiem:", staffSaveError.message);
    return jsonResponse({ error: "Konto nie zostało zapisane w kartotece pracowników." }, 500);
  }

  return jsonResponse({ success: true, staffId: existingStaff?.id || null });
});
