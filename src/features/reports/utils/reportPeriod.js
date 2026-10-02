const parseLocalDate = (dateValue) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getPeriodRange = (period, dateValue) => {
  const referenceDate = parseLocalDate(dateValue);
  let start;
  let end;

  if (period === "week") {
    start = new Date(referenceDate);
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (period === "month") {
    start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  } else {
    start = referenceDate;
    end = new Date(referenceDate);
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

export const getPeriodLabel = (period, dateValue) => {
  const { start, end } = getPeriodRange(period, dateValue);
  const formatDate = (date) => date.toLocaleDateString("pl-PL");

  if (period === "day") return formatDate(start);
  if (period === "month") return start.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  return `${formatDate(start)}–${formatDate(lastDay)}`;
};

export const getInitialDate = () => toDateInputValue(new Date());

export const getDateInputValue = (period, dateValue) => {
  if (period !== "month") return dateValue;
  return dateValue.slice(0, 7);
};

export const normalizeDateInput = (period, inputValue, previousValue) => {
  if (period !== "month") return inputValue;

  const [year, month] = inputValue.split("-");
  const previousDay = previousValue.slice(8, 10) || "01";
  return `${year}-${month}-${previousDay}`;
};