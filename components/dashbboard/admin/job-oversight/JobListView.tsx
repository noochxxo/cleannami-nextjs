// "use client";
// import {
//   ChevronDownIcon,
//   ChevronUpIcon,
//   TriangleAlertIcon,
// } from "lucide-react";
// import { useMemo, useState } from "react";
// import { getStatusBadge } from "../../utils";
// import { Route } from "next";
// import Link from "next/link";
// import { jobs } from "@/db/schemas";
// import { useCurrentUser } from "@/hooks/useCurrentUser";

// type SortDirection = "ascending" | "descending";
// type SortableKey =
//   | "id"
//   | "propertyName"
//   | "cleanerName"
//   | "status"
//   | "scheduledDateTime";

// interface SortConfig {
//   key: SortableKey;
//   direction: SortDirection;
// }

// async function fetchJobs({ pageParam = 1 }: { pageParam: number }) {
//   const res = await fetch(`/api/jobs?page=${pageParam}`);
//   if (!res.ok) {
//     throw new Error("Network response was not ok");
//   }
//   const result: GetJobsResponse = await res.json();
//   return {
//     jobs: result.data,
//     nextPage: result.nextPage,
//   };
// }

// export const JobListView = () => {

//   const { data: user } = useCurrentUser();
//     const isAdmin =
//       user?.user_metadata.role === "admin" ||
//       user?.user_metadata.role === "super_admin";

//     const { data: stats } = useQuery({
//         queryKey: ["jobs", "stats"],
//         queryFn: async () => {
//           const res = await fetch("/api/jobs/stats");
//           if (!res.ok) throw new Error("Failed to fetch stats");
//           return res.json() as Promise<GetJobStatsResponse>;
//         },
//         refetchInterval: 30000,
//       });
//   const {
//       data,
//       error,
//       fetchNextPage,
//       hasNextPage,
//       isFetching,
//       isFetchingNextPage,
//       status,
//     } = useInfiniteQuery({
//       queryKey: ["jobs"],
//       queryFn: fetchJobs,
//       initialPageParam: 1,
//       getNextPageParam: (lastPage) => lastPage.nextPage,
//     });

//   const [activeFilter, setActiveFilter] = useState<
//     JobStatus | "All" | "Flagged"
//   >("All");
//   const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

//   const filters: (JobStatus | "All" | "Flagged")[] = [
//     "All",
//     "Pending",
//     "Assigned",
//     "In Progress",
//     "Awaiting Capture",
//     "Canceled",
//     "Flagged",
//   ];

//   const enrichedJobs = useMemo(() => {
//     return jobs.map((job) => {
//       const property = properties.find((p) => p.id === job.propertyId);
//       const cleaner = cleaners.find((c) => c.id === job.cleanerId);
//       return {
//         ...job,
//         propertyName: property?.address || "N/A",
//         cleanerName: cleaner?.name || "Unassigned",
//       };
//     });
//   }, []);

//   const filteredJobs = useMemo(
//     () =>
//       enrichedJobs.filter((job) => {
//         if (activeFilter === "All") return true;
//         if (activeFilter === "Flagged")
//           return job.flags.some((f) => !f.resolved);
//         return job.status === activeFilter;
//       }),
//     [enrichedJobs, activeFilter]
//   );

//   const sortedJobs = useMemo(() => {
//     let sortableItems = [...filteredJobs];
//     if (sortConfig !== null) {
//       sortableItems.sort((a, b) => {
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//           return sortConfig.direction === "ascending" ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//           return sortConfig.direction === "ascending" ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortableItems;
//   }, [filteredJobs, sortConfig]);

//   const requestSort = (key: SortableKey) => {
//     let direction: SortDirection = "ascending";
//     if (
//       sortConfig &&
//       sortConfig.key === key &&
//       sortConfig.direction === "ascending"
//     ) {
//       direction = "descending";
//     }
//     setSortConfig({ key, direction });
//   };

//   const headers: { key: SortableKey; label: string }[] = [
//     { key: "id", label: "Job ID" },
//     { key: "propertyName", label: "Property" },
//     { key: "cleanerName", label: "Cleaner" },
//     { key: "status", label: "Status" },
//     { key: "scheduledDateTime", label: "Scheduled For" },
//   ];

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-wrap items-center gap-2">
//         {filters.map((filter) => (
//           <button
//             key={filter}
//             onClick={() => setActiveFilter(filter)}
//             className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
//               activeFilter === filter
//                 ? "bg-teal-500 text-white shadow"
//                 : "bg-white text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             {filter}
//           </button>
//         ))}
//       </div>
//       <div className="bg-white rounded-lg shadow-md overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 {headers.map((header) => (
//                   <th
//                     key={header.key}
//                     scope="col"
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     <button
//                       onClick={() => requestSort(header.key)}
//                       className="flex items-center group focus:outline-none"
//                     >
//                       {header.label}
//                       <span className="ml-2">
//                         {sortConfig?.key === header.key ? (
//                           sortConfig.direction === "ascending" ? (
//                             <ChevronUpIcon className="h-4 w-4" />
//                           ) : (
//                             <ChevronDownIcon className="h-4 w-4" />
//                           )
//                         ) : (
//                           <ChevronDownIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
//                         )}
//                       </span>
//                     </button>
//                   </th>
//                 ))}
//                 <th scope="col" className="relative px-6 py-3">
//                   <span className="sr-only">Actions</span>
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {sortedJobs.map((job) => (
//                 <tr key={job.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     {job.id}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {job.propertyName}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {job.cleanerName}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <span
//                         className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
//                           job.status
//                         )}`}
//                       >
//                         {job.status}
//                       </span>
//                       {job.flags.some((f) => !f.resolved) && (
//                         <div className="ml-2 group relative">
//                           <TriangleAlertIcon className="h-5 w-5 text-red-500" />
//                         </div>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {/* {formatDate(job.scheduledDateTime)} */}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                       <Link href={`/admin/job-oversight/${job.id}` as Route} className="text-teal-600 hover:text-teal-900">
//                           Details
//                       </Link>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         {sortedJobs.length === 0 && (
//           <div className="text-center py-12">
//             <p className="text-gray-500">No jobs match the current filter.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

import React from 'react'

type Props = {}

const JobListView = (props: Props) => {
  return (
    <div>JobListView</div>
  )
}