import React, { Suspense } from "react";

function PeopleContent() {
  return (
    <main
      style={{
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <h1 style={{ fontSize: "1.05rem", fontWeight: 800 }}>People</h1>
      <p style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.6)" }}>
        User directory and people features will be available here soon.
      </p>
    </main>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<div />}>
      <PeopleContent />
    </Suspense>
  );
}
