'use client'
import React, { useState } from "react";

export const JobCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

 
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfWeek = startOfMonth.getDay();

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <button
          // onClick={() => changeMonth(-1)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          // onClick={() => changeMonth(1)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold"
        >
          →
        </button>
      </div>

      {/* Calendar - scrollable on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-max md:min-w-0 p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-600 min-w-24"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-w-24"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              // const dayJobs = getJobsForDay(day);
              // const today = isToday(day);

              return (
                <div
                  key={day}
                  className={`min-w-24 min-h-24 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    false
                      ? "border-teal-500 border-2 bg-teal-50"
                      : "border-gray-200"
                  }`}
                  // onClick={() =>
                  //   dayJobs.length > 0 && setSelectedDay({ day, jobs: dayJobs })
                  // }
                >
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      false ? "text-teal-600" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>

                  <div className="space-y-1">
                    {/* {dayJobs.slice(0, 3).map((job) => {
                      const isCanceled = job.status === "Canceled";
                      const time = new Date(
                        job.scheduledDateTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={job.id}
                          className={`p-1 rounded text-xs ${getStatusBadge(
                            job.status
                          )}`}
                        >
                          <div
                            className={`font-bold ${
                              isCanceled ? "line-through" : ""
                            }`}
                          >
                            {job.id}
                          </div>
                          <div
                            className={`text-xs ${
                              isCanceled ? "line-through" : ""
                            }`}
                          >
                            {time}
                          </div>
                        </div>
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <div className="text-xs text-gray-600 font-semibold">
                        +{dayJobs.length - 3} more
                      </div>
                    )} */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected job details */}
      {selectedJob && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">Job Details</h3>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            <p>
              {/* <span className="font-semibold">Job ID:</span> {selectedJob.id} */}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {/* {selectedJob.status} */}
            </p>
            <p>
              <span className="font-semibold">Cleaner:</span>{" "}
              {/* {selectedJob.cleanerName || "Unassigned"} */}
            </p>
            <p>
              <span className="font-semibold">Time:</span>{" "}
              {/* {new Date(selectedJob.scheduledDateTime).toLocaleString()} */}
            </p>
          </div>
        </div>
      )}

      {/* Day popup modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-lg">
              <h3 className="font-bold text-lg">
                Jobs for{" "}
                {currentDate.toLocaleString("default", { month: "long" })}{" "}
                {/* {selectedDay.day} ({selectedDay.jobs.length} jobs) */}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* {selectedDay.jobs.map((job) => {
                const isCanceled = job.status === "Canceled";
                const time = new Date(job.scheduledDateTime).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setSelectedDay(null);
                    }}
                    className={`p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-teal-500 ${getStatusColor(
                      job.status
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className={`font-bold text-lg ${
                          isCanceled ? "line-through" : ""
                        }`}
                      >
                        {job.id}
                      </div>
                      <div
                        className={`text-sm ${
                          isCanceled ? "line-through" : ""
                        }`}
                      >
                        {time}
                      </div>
                    </div>
                    <div
                      className={`text-sm ${isCanceled ? "line-through" : ""}`}
                    >
                      <p>
                        <span className="font-semibold">Status:</span>{" "}
                        {job.status}
                      </p>
                      <p>
                        <span className="font-semibold">Cleaner:</span>{" "}
                        {job.cleanerName || "Unassigned"}
                      </p>
                    </div>
                  </div>
                );
              })} */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
