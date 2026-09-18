const request = async (path, options = {}) => {
  const token = localStorage.getItem('schoolToken');
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Wystąpił błąd połączenia z serwerem.');
  return body;
};

export const login = (credentials) => request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const getClasses = () => request('/api/classes');

export const getClass = (classId) => request(`/api/classes/${classId}`);
