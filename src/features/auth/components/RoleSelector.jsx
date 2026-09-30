import React from "react";
import { BsDisplay, BsPeople } from "react-icons/bs";
import { SlBadge } from "react-icons/sl";

const roles = [
  { id: "Nauczyciel", label: "Nauczyciel", icon: <BsDisplay size={28} className="mb-2" />, bgColor: "#8b5cf6" },
  { id: "Dyrektor", label: "Dyrektor", icon: <SlBadge size={28} className="mb-2" />, bgColor: "#10b981" },
  { id: "Pedagog", label: "Pedagog", icon: <BsPeople size={28} className="mb-2" />, bgColor: "#3b82f6" },
];

const RoleSelector = ({ value, onChange }) => (
  <div className="d-flex justify-content-between gap-3 mb-4" role="group" aria-label="Wybierz rolę">
    {roles.map((role) => (
      <button
        key={role.id}
        type="button"
        aria-pressed={value === role.id}
        onClick={() => onChange(role.id)}
        className="btn flex-fill d-flex flex-column align-items-center justify-content-center p-3 rounded-4 border-0 text-white transition"
        style={{
          backgroundColor: role.bgColor,
          border: value === role.id ? "10px solid black" : "3px solid black",
          height: value === role.id ? "115px" : "110px",
          width: value === role.id ? "115px" : "110px",
        }}
      >
        {role.icon}
        <span className="small fw-semibold">{role.label}</span>
      </button>
    ))}
  </div>
);

export default RoleSelector;