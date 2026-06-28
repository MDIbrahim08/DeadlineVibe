import React from "react";
import WeeklyInsights from "../components/WeeklyInsights";

export default function InsightsPage({ tasks }: any) {
  return (
    <div className="animate-fade-in-up w-full max-w-5xl mx-auto relative">
      {/* We can reuse the existing WeeklyInsights component, 
          but usually it acts as a modal. We will pass a dummy onClose if it expects one,
          or we can render it inline here. */}
      <WeeklyInsights tasks={tasks} onClose={() => window.history.back()} />
    </div>
  );
}
