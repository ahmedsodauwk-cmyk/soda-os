import type { Project, ProjectTeamMember } from "@/lib/projects/types";

const team = {
  ahmed: {
    id: "tm-ahmed",
    name: "Ahmed Hassan",
    role: "Producer",
    initials: "AH",
  },
  sara: {
    id: "tm-sara",
    name: "Sara Nabil",
    role: "Lead Photographer",
    initials: "SN",
  },
  karim: {
    id: "tm-karim",
    name: "Karim Fouad",
    role: "Videographer",
    initials: "KF",
  },
  layla: {
    id: "tm-layla",
    name: "Layla Mansour",
    role: "Editor",
    initials: "LM",
  },
  omar: {
    id: "tm-omar",
    name: "Omar Saleh",
    role: "Drone Operator",
    initials: "OS",
  },
  dina: {
    id: "tm-dina",
    name: "Dina Farid",
    role: "Client Lead",
    initials: "DF",
  },
  youssef: {
    id: "tm-youssef",
    name: "Youssef Amir",
    role: "Lighting Tech",
    initials: "YA",
  },
  nora: {
    id: "tm-nora",
    name: "Nora Khalil",
    role: "Second Shooter",
    initials: "NK",
  },
} satisfies Record<string, ProjectTeamMember>;

function hubDefaults(partial: {
  overview: Project["overview"];
  orders: Project["orders"];
  calendar: Project["calendar"];
  files: Project["files"];
  payments: Project["payments"];
  timeline: Project["timeline"];
  notes: Project["notes"];
  activity: Project["activity"];
  deliverables: Project["deliverables"];
}) {
  return partial;
}

export const mockProjects: Project[] = [
  {
    id: "PRJ-2026-0001",
    name: "Future City",
    workspaceId: "rtm",
    subcategoryId: "rtm-future-city",
    clientName: "Palm Hills Developments",
    clientId: "client-palm-hills",
    status: "Active",
    progress: 72,
    ordersCount: 3,
    revenue: 186000,
    team: [team.ahmed, team.sara, team.omar, team.layla],
    upcomingShoots: [
      {
        id: "shoot-fc-1",
        title: "Phase 2 villa walkthrough",
        date: "2026-07-18",
        location: "New Cairo Compound",
        status: "Scheduled",
      },
      {
        id: "shoot-fc-2",
        title: "Amenity drone pass",
        date: "2026-07-25",
        location: "Future City Clubhouse",
        status: "Pending",
      },
    ],
    lastActivity: "2026-07-08T14:20:00Z",
    description:
      "Ongoing RTM content for Future City masterplan — exteriors, lifestyle, and sales assets.",
    createdAt: "2026-01-12T09:00:00Z",
    updatedAt: "2026-07-08T14:20:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Multi-phase RTM program covering villa showcases, amenity lifestyle, and sales gallery refresh.",
        milestones: [
          "Phase 1 villa package delivered",
          "Sales gallery stills approved",
          "Phase 2 walkthrough scheduled",
        ],
        nextAction: "Confirm July 18 crew call sheet with Palm Hills marketing.",
      },
      orders: [
        {
          id: "SODA-2026-0013",
          clientName: "Palm Hills Developments",
          status: "Delivered",
          shootDate: "2026-02-20",
          price: 68000,
        },
        {
          id: "SODA-2026-0016",
          clientName: "Palm Hills Developments",
          status: "Editing",
          shootDate: "2026-06-02",
          price: 54000,
        },
        {
          id: "SODA-2026-0017",
          clientName: "Palm Hills Developments",
          status: "Scheduled",
          shootDate: "2026-07-18",
          price: 64000,
        },
      ],
      calendar: [
        {
          id: "cal-fc-1",
          title: "Phase 2 villa walkthrough",
          startsAt: "2026-07-18T08:00:00Z",
          kind: "shoot",
          location: "New Cairo Compound",
        },
        {
          id: "cal-fc-2",
          title: "Amenity drone pass",
          startsAt: "2026-07-25T06:30:00Z",
          kind: "shoot",
          location: "Future City Clubhouse",
        },
        {
          id: "cal-fc-3",
          title: "Phase 2 delivery",
          startsAt: "2026-08-05T12:00:00Z",
          kind: "delivery",
        },
      ],
      files: [
        {
          id: "file-fc-1",
          name: "FutureCity_Phase1_Selects.zip",
          type: "Archive",
          size: "4.2 GB",
          updatedAt: "2026-03-06T10:00:00Z",
        },
        {
          id: "file-fc-2",
          name: "Sales_Gallery_Stills_v3.pdf",
          type: "PDF",
          size: "28 MB",
          updatedAt: "2026-06-12T16:40:00Z",
        },
        {
          id: "file-fc-3",
          name: "Call_Sheet_Jul18.pdf",
          type: "PDF",
          size: "420 KB",
          updatedAt: "2026-07-07T11:15:00Z",
        },
      ],
      payments: [
        {
          id: "pay-fc-1",
          label: "Phase 1 deposit",
          amount: 22000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-02-01",
        },
        {
          id: "pay-fc-2",
          label: "Phase 1 final",
          amount: 46000,
          kind: "final",
          status: "paid",
          paidAt: "2026-03-08",
        },
        {
          id: "pay-fc-3",
          label: "Phase 2 deposit",
          amount: 20000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-05-20",
        },
        {
          id: "pay-fc-4",
          label: "Phase 2 balance",
          amount: 34000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-fc-1",
          title: "Kickoff",
          description: "Scope locked for Future City RTM retainer.",
          date: "2026-01-12",
          type: "milestone",
        },
        {
          id: "tl-fc-2",
          title: "Phase 1 delivered",
          description: "Villa showcase package approved by client.",
          date: "2026-03-05",
          type: "delivery",
        },
        {
          id: "tl-fc-3",
          title: "Phase 2 scheduled",
          description: "Walkthrough and drone day booked for July.",
          date: "2026-06-28",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-fc-1",
          author: "Ahmed Hassan",
          body: "Client wants warmer grade on interiors — match Phase 1 LUT.",
          createdAt: "2026-07-06T09:30:00Z",
        },
        {
          id: "note-fc-2",
          author: "Dina Farid",
          body: "Marketing asked for vertical cuts for Instagram Reels.",
          createdAt: "2026-07-08T14:20:00Z",
        },
      ],
      activity: [
        {
          id: "act-fc-1",
          actor: "Sara Nabil",
          action: "Uploaded Sales_Gallery_Stills_v3.pdf",
          createdAt: "2026-06-12T16:40:00Z",
        },
        {
          id: "act-fc-2",
          actor: "Ahmed Hassan",
          action: "Scheduled Phase 2 villa walkthrough",
          createdAt: "2026-06-28T11:00:00Z",
        },
        {
          id: "act-fc-3",
          actor: "Dina Farid",
          action: "Added note about Reels deliverables",
          createdAt: "2026-07-08T14:20:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-fc-1",
          name: "Phase 1 villa package",
          status: "delivered",
          dueDate: "2026-03-05",
        },
        {
          id: "del-fc-2",
          name: "Sales gallery stills",
          status: "delivered",
          dueDate: "2026-06-15",
        },
        {
          id: "del-fc-3",
          name: "Phase 2 walkthrough film",
          status: "in_progress",
          dueDate: "2026-08-05",
        },
        {
          id: "del-fc-4",
          name: "Vertical Reels cutdowns",
          status: "pending",
          dueDate: "2026-08-12",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0002",
    name: "Daily Work",
    workspaceId: "rtm",
    subcategoryId: "rtm-daily-work",
    clientName: "Galaxy Company",
    clientId: "client-galaxy",
    status: "Active",
    progress: 58,
    ordersCount: 4,
    revenue: 142000,
    team: [team.karim, team.layla, team.nora],
    upcomingShoots: [
      {
        id: "shoot-dw-1",
        title: "Weekly product drop",
        date: "2026-07-14",
        location: "Smart Village, Giza",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-09T08:15:00Z",
    description: "Standing RTM daily content pipeline for Galaxy product launches.",
    createdAt: "2025-11-01T09:00:00Z",
    updatedAt: "2026-07-09T08:15:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Recurring weekly RTM shoots covering product drops, founder clips, and social cutdowns.",
        milestones: [
          "Q1 launch campaign delivered",
          "Weekly cadence stabilized",
          "July drop shoot booked",
        ],
        nextAction: "Confirm product SKUs for July 14 studio day.",
      },
      orders: [
        {
          id: "SODA-2026-0003",
          clientName: "Galaxy Company",
          status: "Delivered",
          shootDate: "2026-01-20",
          price: 120000,
        },
        {
          id: "SODA-2026-0018",
          clientName: "Galaxy Company",
          status: "Editing",
          shootDate: "2026-06-20",
          price: 22000,
        },
      ],
      calendar: [
        {
          id: "cal-dw-1",
          title: "Weekly product drop",
          startsAt: "2026-07-14T09:00:00Z",
          kind: "shoot",
          location: "Smart Village, Giza",
        },
        {
          id: "cal-dw-2",
          title: "June drop delivery",
          startsAt: "2026-07-12T17:00:00Z",
          kind: "delivery",
        },
      ],
      files: [
        {
          id: "file-dw-1",
          name: "Galaxy_Q1_Launch_Master.mp4",
          type: "Video",
          size: "8.1 GB",
          updatedAt: "2026-02-10T12:00:00Z",
        },
        {
          id: "file-dw-2",
          name: "June_Drop_Selects.zip",
          type: "Archive",
          size: "1.4 GB",
          updatedAt: "2026-06-22T18:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-dw-1",
          label: "Q1 campaign deposit",
          amount: 40000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-01-05",
        },
        {
          id: "pay-dw-2",
          label: "Q1 campaign final",
          amount: 80000,
          kind: "final",
          status: "paid",
          paidAt: "2026-02-12",
        },
        {
          id: "pay-dw-3",
          label: "June retainer",
          amount: 22000,
          kind: "installment",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-dw-1",
          title: "Retainer started",
          description: "Daily Work lane opened for Galaxy.",
          date: "2025-11-01",
          type: "milestone",
        },
        {
          id: "tl-dw-2",
          title: "Q1 launch delivered",
          description: "Photo and video package signed off.",
          date: "2026-02-10",
          type: "delivery",
        },
      ],
      notes: [
        {
          id: "note-dw-1",
          author: "Karim Fouad",
          body: "Need cleaner white seamless for July SKUs.",
          createdAt: "2026-07-09T08:15:00Z",
        },
      ],
      activity: [
        {
          id: "act-dw-1",
          actor: "Layla Mansour",
          action: "Started edit on June drop selects",
          createdAt: "2026-06-22T19:00:00Z",
        },
        {
          id: "act-dw-2",
          actor: "Karim Fouad",
          action: "Added note about seamless backdrop",
          createdAt: "2026-07-09T08:15:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-dw-1",
          name: "Q1 launch package",
          status: "delivered",
          dueDate: "2026-02-10",
        },
        {
          id: "del-dw-2",
          name: "June social cutdowns",
          status: "in_progress",
          dueDate: "2026-07-12",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0003",
    name: "Internal",
    workspaceId: "rtm",
    subcategoryId: "rtm-internal",
    clientName: "SODA Visuals",
    status: "Active",
    progress: 35,
    ordersCount: 2,
    revenue: 0,
    team: [team.dina, team.sara, team.youssef],
    upcomingShoots: [
      {
        id: "shoot-in-1",
        title: "Studio brand portraits",
        date: "2026-07-16",
        location: "SODA Studio A, Maadi",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-05T11:00:00Z",
    description: "Internal studio assets, headshots, and process documentation.",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-07-05T11:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Non-billable internal production for brand, hiring, and studio marketing.",
        milestones: [
          "Team headshot brief approved",
          "Studio tour script drafted",
        ],
        nextAction: "Shoot remaining team portraits on July 16.",
      },
      orders: [
        {
          id: "SODA-2026-0014",
          clientName: "Dr. Hana Mostafa",
          status: "Pending",
          shootDate: "2026-05-03",
          price: 6500,
        },
      ],
      calendar: [
        {
          id: "cal-in-1",
          title: "Studio brand portraits",
          startsAt: "2026-07-16T10:00:00Z",
          kind: "shoot",
          location: "SODA Studio A, Maadi",
        },
      ],
      files: [
        {
          id: "file-in-1",
          name: "Internal_Brand_Brief.pdf",
          type: "PDF",
          size: "1.1 MB",
          updatedAt: "2026-06-01T09:00:00Z",
        },
      ],
      payments: [],
      timeline: [
        {
          id: "tl-in-1",
          title: "Internal lane opened",
          description: "RTM internal projects board created.",
          date: "2026-03-01",
          type: "milestone",
        },
      ],
      notes: [
        {
          id: "note-in-1",
          author: "Dina Farid",
          body: "Prioritize crew portraits before website relaunch.",
          createdAt: "2026-07-05T11:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-in-1",
          actor: "Dina Farid",
          action: "Scheduled studio brand portraits",
          createdAt: "2026-07-05T11:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-in-1",
          name: "Team portrait set",
          status: "in_progress",
          dueDate: "2026-07-30",
        },
        {
          id: "del-in-2",
          name: "Studio tour reel",
          status: "pending",
          dueDate: "2026-08-15",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0004",
    name: "Partner Projects",
    workspaceId: "rtm",
    subcategoryId: "rtm-partner-projects",
    clientName: "Wav Studios",
    clientId: "client-wav",
    status: "Active",
    progress: 45,
    ordersCount: 2,
    revenue: 42000,
    team: [team.karim, team.omar, team.youssef],
    upcomingShoots: [
      {
        id: "shoot-pp-1",
        title: "Indie artist music video",
        date: "2026-07-22",
        location: "Downtown Cairo Warehouse",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-07T17:45:00Z",
    description: "Co-productions and partner studio collaborations.",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-07-07T17:45:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Partner lane for Wav Studios co-productions — music video and branded content.",
        milestones: [
          "Creative treatment approved",
          "Warehouse location locked",
        ],
        nextAction: "Finalize lighting plot with Wav creative director.",
      },
      orders: [
        {
          id: "SODA-2026-0015",
          clientName: "Wav Studios",
          status: "Scheduled",
          shootDate: "2026-04-22",
          price: 42000,
        },
      ],
      calendar: [
        {
          id: "cal-pp-1",
          title: "Indie artist music video",
          startsAt: "2026-07-22T07:00:00Z",
          kind: "shoot",
          location: "Downtown Cairo Warehouse",
        },
        {
          id: "cal-pp-2",
          title: "Rough cut review",
          startsAt: "2026-08-01T15:00:00Z",
          kind: "milestone",
        },
      ],
      files: [
        {
          id: "file-pp-1",
          name: "MV_Treatment_v2.pdf",
          type: "PDF",
          size: "6.4 MB",
          updatedAt: "2026-07-01T13:00:00Z",
        },
        {
          id: "file-pp-2",
          name: "Location_Scouts.zip",
          type: "Archive",
          size: "890 MB",
          updatedAt: "2026-07-07T17:45:00Z",
        },
      ],
      payments: [
        {
          id: "pay-pp-1",
          label: "Music video deposit",
          amount: 14000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-04-01",
        },
        {
          id: "pay-pp-2",
          label: "Music video balance",
          amount: 28000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-pp-1",
          title: "Partner kickoff",
          description: "Wav Studios collaboration agreement signed.",
          date: "2026-02-15",
          type: "milestone",
        },
        {
          id: "tl-pp-2",
          title: "Location locked",
          description: "Downtown warehouse booked for July shoot.",
          date: "2026-07-07",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-pp-1",
          author: "Omar Saleh",
          body: "Ceiling height is tight — bring compact jib instead of full crane.",
          createdAt: "2026-07-07T17:45:00Z",
        },
      ],
      activity: [
        {
          id: "act-pp-1",
          actor: "Omar Saleh",
          action: "Uploaded location scout stills",
          createdAt: "2026-07-07T17:45:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-pp-1",
          name: "Music video master",
          status: "pending",
          dueDate: "2026-08-15",
        },
        {
          id: "del-pp-2",
          name: "Vertical teaser",
          status: "pending",
          dueDate: "2026-08-10",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0005",
    name: "Last Step",
    workspaceId: "commercial",
    subcategoryId: "commercial-campaigns",
    clientName: "Last Step Footwear",
    status: "Active",
    progress: 62,
    ordersCount: 2,
    revenue: 98000,
    team: [team.sara, team.karim, team.layla, team.nora],
    upcomingShoots: [
      {
        id: "shoot-ls-1",
        title: "Fall campaign hero day",
        date: "2026-07-20",
        location: "SODA Studio A, Maadi",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-08T10:30:00Z",
    description: "Brand campaign for Last Step footwear launch.",
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-07-08T10:30:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Commercial campaign covering hero stills, motion, and retail POS assets for Last Step.",
        milestones: [
          "Moodboard approved",
          "Talent cast",
          "Hero day scheduled",
        ],
        nextAction: "Lock wardrobe fittings before July 20.",
      },
      orders: [
        {
          id: "SODA-2026-0019",
          clientName: "Last Step Footwear",
          status: "Editing",
          shootDate: "2026-05-28",
          price: 48000,
        },
        {
          id: "SODA-2026-0020",
          clientName: "Last Step Footwear",
          status: "Scheduled",
          shootDate: "2026-07-20",
          price: 50000,
        },
      ],
      calendar: [
        {
          id: "cal-ls-1",
          title: "Fall campaign hero day",
          startsAt: "2026-07-20T08:00:00Z",
          kind: "shoot",
          location: "SODA Studio A, Maadi",
        },
      ],
      files: [
        {
          id: "file-ls-1",
          name: "LastStep_Moodboard.pdf",
          type: "PDF",
          size: "12 MB",
          updatedAt: "2026-04-20T11:00:00Z",
        },
        {
          id: "file-ls-2",
          name: "May_Hero_Selects.zip",
          type: "Archive",
          size: "3.6 GB",
          updatedAt: "2026-06-02T15:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-ls-1",
          label: "Campaign deposit",
          amount: 30000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-04-10",
        },
        {
          id: "pay-ls-2",
          label: "May shoot installment",
          amount: 28000,
          kind: "installment",
          status: "paid",
          paidAt: "2026-06-05",
        },
        {
          id: "pay-ls-3",
          label: "Final balance",
          amount: 40000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-ls-1",
          title: "Campaign kickoff",
          description: "Creative brief signed with Last Step.",
          date: "2026-04-01",
          type: "milestone",
        },
        {
          id: "tl-ls-2",
          title: "May hero day complete",
          description: "Primary stills captured; edit in progress.",
          date: "2026-05-28",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-ls-1",
          author: "Sara Nabil",
          body: "Client prefers cooler grade vs May selects.",
          createdAt: "2026-07-08T10:30:00Z",
        },
      ],
      activity: [
        {
          id: "act-ls-1",
          actor: "Layla Mansour",
          action: "Shared May hero selects with client",
          createdAt: "2026-06-02T15:30:00Z",
        },
        {
          id: "act-ls-2",
          actor: "Sara Nabil",
          action: "Updated grade preference note",
          createdAt: "2026-07-08T10:30:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-ls-1",
          name: "May hero stills",
          status: "in_progress",
          dueDate: "2026-07-15",
        },
        {
          id: "del-ls-2",
          name: "Fall campaign film",
          status: "pending",
          dueDate: "2026-08-20",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0006",
    name: "Palm Hills",
    workspaceId: "commercial",
    subcategoryId: "commercial-corporate",
    clientName: "Palm Hills Developments",
    clientId: "client-palm-hills",
    status: "Active",
    progress: 80,
    ordersCount: 2,
    revenue: 125000,
    team: [team.ahmed, team.omar, team.layla],
    upcomingShoots: [
      {
        id: "shoot-ph-1",
        title: "Corporate HQ portraits",
        date: "2026-07-28",
        location: "Palm Hills HQ, New Cairo",
        status: "Pending",
      },
    ],
    lastActivity: "2026-07-04T13:00:00Z",
    description: "Corporate commercial package for Palm Hills brand and leadership.",
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-07-04T13:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Corporate commercial work spanning compound films and executive portraits.",
        milestones: [
          "Compound film delivered",
          "Leadership portrait brief approved",
        ],
        nextAction: "Confirm HQ access badges for July 28.",
      },
      orders: [
        {
          id: "SODA-2026-0021",
          clientName: "Palm Hills Developments",
          status: "Delivered",
          shootDate: "2026-03-10",
          price: 85000,
        },
        {
          id: "SODA-2026-0022",
          clientName: "Palm Hills Developments",
          status: "Scheduled",
          shootDate: "2026-07-28",
          price: 40000,
        },
      ],
      calendar: [
        {
          id: "cal-ph-1",
          title: "Corporate HQ portraits",
          startsAt: "2026-07-28T09:00:00Z",
          kind: "shoot",
          location: "Palm Hills HQ, New Cairo",
        },
      ],
      files: [
        {
          id: "file-ph-1",
          name: "PalmHills_Compound_Film_vFinal.mp4",
          type: "Video",
          size: "6.8 GB",
          updatedAt: "2026-03-28T10:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-ph-1",
          label: "Compound film deposit",
          amount: 30000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-02-15",
        },
        {
          id: "pay-ph-2",
          label: "Compound film final",
          amount: 55000,
          kind: "final",
          status: "paid",
          paidAt: "2026-03-30",
        },
        {
          id: "pay-ph-3",
          label: "Portraits deposit",
          amount: 15000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-07-01",
        },
      ],
      timeline: [
        {
          id: "tl-ph-1",
          title: "Corporate package started",
          description: "Palm Hills commercial SOW signed.",
          date: "2026-01-20",
          type: "milestone",
        },
        {
          id: "tl-ph-2",
          title: "Compound film delivered",
          description: "Final master approved by marketing.",
          date: "2026-03-28",
          type: "delivery",
        },
      ],
      notes: [
        {
          id: "note-ph-1",
          author: "Ahmed Hassan",
          body: "CEO prefers natural window light for portraits.",
          createdAt: "2026-07-04T13:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-ph-1",
          actor: "Ahmed Hassan",
          action: "Scheduled corporate HQ portraits",
          createdAt: "2026-07-04T13:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-ph-1",
          name: "Compound film",
          status: "delivered",
          dueDate: "2026-03-28",
        },
        {
          id: "del-ph-2",
          name: "Leadership portrait set",
          status: "pending",
          dueDate: "2026-08-10",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0007",
    name: "Vodafone Campaign",
    workspaceId: "commercial",
    subcategoryId: "commercial-campaigns",
    clientName: "Vodafone Egypt",
    status: "Active",
    progress: 40,
    ordersCount: 1,
    revenue: 210000,
    team: [team.ahmed, team.sara, team.karim, team.omar, team.youssef],
    upcomingShoots: [
      {
        id: "shoot-vf-1",
        title: "Campaign day 1 — street",
        date: "2026-08-02",
        location: "Downtown Cairo",
        status: "Scheduled",
      },
      {
        id: "shoot-vf-2",
        title: "Campaign day 2 — studio",
        date: "2026-08-03",
        location: "SODA Studio A, Maadi",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-09T16:00:00Z",
    description: "National brand campaign production for Vodafone Egypt.",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-07-09T16:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Two-day commercial campaign with street and studio units for Vodafone summer push.",
        milestones: [
          "Agency treatment approved",
          "Permits in progress",
          "Shoot days locked",
        ],
        nextAction: "Submit Downtown filming permit package.",
      },
      orders: [
        {
          id: "SODA-2026-0023",
          clientName: "Vodafone Egypt",
          status: "Scheduled",
          shootDate: "2026-08-02",
          price: 210000,
        },
      ],
      calendar: [
        {
          id: "cal-vf-1",
          title: "Campaign day 1 — street",
          startsAt: "2026-08-02T06:00:00Z",
          kind: "shoot",
          location: "Downtown Cairo",
        },
        {
          id: "cal-vf-2",
          title: "Campaign day 2 — studio",
          startsAt: "2026-08-03T08:00:00Z",
          kind: "shoot",
          location: "SODA Studio A, Maadi",
        },
        {
          id: "cal-vf-3",
          title: "Agency review",
          startsAt: "2026-08-20T14:00:00Z",
          kind: "milestone",
        },
      ],
      files: [
        {
          id: "file-vf-1",
          name: "Vodafone_Treatment_Final.pdf",
          type: "PDF",
          size: "18 MB",
          updatedAt: "2026-06-15T10:00:00Z",
        },
        {
          id: "file-vf-2",
          name: "Permit_Checklist.xlsx",
          type: "Spreadsheet",
          size: "84 KB",
          updatedAt: "2026-07-09T16:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-vf-1",
          label: "Campaign deposit",
          amount: 70000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-05-25",
        },
        {
          id: "pay-vf-2",
          label: "Pre-production installment",
          amount: 70000,
          kind: "installment",
          status: "pending",
        },
        {
          id: "pay-vf-3",
          label: "Final balance",
          amount: 70000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-vf-1",
          title: "Awarded",
          description: "Vodafone campaign awarded to SODA.",
          date: "2026-05-10",
          type: "milestone",
        },
        {
          id: "tl-vf-2",
          title: "Shoot dates locked",
          description: "Aug 2–3 production window confirmed.",
          date: "2026-06-30",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-vf-1",
          author: "Ahmed Hassan",
          body: "Agency wants dual-language end cards — EN/AR.",
          createdAt: "2026-07-09T16:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-vf-1",
          actor: "Ahmed Hassan",
          action: "Updated permit checklist",
          createdAt: "2026-07-09T16:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-vf-1",
          name: "Hero :30 spot",
          status: "pending",
          dueDate: "2026-08-25",
        },
        {
          id: "del-vf-2",
          name: "Social cutdowns pack",
          status: "pending",
          dueDate: "2026-08-28",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0008",
    name: "April 2026",
    workspaceId: "weddings",
    subcategoryId: "weddings-upcoming",
    clientName: "Ahmed Ali",
    status: "Active",
    progress: 68,
    ordersCount: 2,
    revenue: 107000,
    team: [team.sara, team.nora, team.layla, team.omar],
    upcomingShoots: [
      {
        id: "shoot-apr-1",
        title: "Delivery review meeting",
        date: "2026-07-12",
        location: "SODA Studio A, Maadi",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-06T19:00:00Z",
    description: "April wedding slate — ceremony coverage and album production.",
    createdAt: "2025-12-01T09:00:00Z",
    updatedAt: "2026-07-06T19:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "April wedding cluster including Ahmed Ali full-day coverage and related engagement work.",
        milestones: [
          "Ceremony shot",
          "Same-day teaser delivered",
          "Album design in progress",
        ],
        nextAction: "Client album design review on July 12.",
      },
      orders: [
        {
          id: "SODA-2026-0001",
          clientName: "Ahmed Ali",
          status: "Editing",
          shootDate: "2026-03-15",
          price: 85000,
        },
        {
          id: "SODA-2026-0002",
          clientName: "Sara Mohamed",
          status: "Scheduled",
          shootDate: "2026-02-28",
          price: 18000,
        },
      ],
      calendar: [
        {
          id: "cal-apr-1",
          title: "Album design review",
          startsAt: "2026-07-12T17:00:00Z",
          kind: "milestone",
          location: "SODA Studio A, Maadi",
        },
        {
          id: "cal-apr-2",
          title: "Final album delivery",
          startsAt: "2026-07-30T12:00:00Z",
          kind: "delivery",
        },
      ],
      files: [
        {
          id: "file-apr-1",
          name: "AhmedAli_SameDay_Teaser.mp4",
          type: "Video",
          size: "1.2 GB",
          updatedAt: "2026-03-16T02:00:00Z",
        },
        {
          id: "file-apr-2",
          name: "Album_Design_v2.pdf",
          type: "PDF",
          size: "45 MB",
          updatedAt: "2026-07-06T19:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-apr-1",
          label: "Wedding deposit",
          amount: 25000,
          kind: "deposit",
          status: "paid",
          paidAt: "2025-12-15",
        },
        {
          id: "pay-apr-2",
          label: "Post-ceremony installment",
          amount: 30000,
          kind: "installment",
          status: "paid",
          paidAt: "2026-03-20",
        },
        {
          id: "pay-apr-3",
          label: "Final balance",
          amount: 30000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-apr-1",
          title: "Booking confirmed",
          description: "April wedding package booked.",
          date: "2025-12-01",
          type: "milestone",
        },
        {
          id: "tl-apr-2",
          title: "Ceremony complete",
          description: "Full-day coverage at Four Seasons.",
          date: "2026-03-15",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-apr-1",
          author: "Layla Mansour",
          body: "Couple prefers warmer skin tones in album spreads.",
          createdAt: "2026-07-06T19:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-apr-1",
          actor: "Layla Mansour",
          action: "Uploaded Album_Design_v2.pdf",
          createdAt: "2026-07-06T19:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-apr-1",
          name: "Same-day teaser",
          status: "delivered",
          dueDate: "2026-03-16",
        },
        {
          id: "del-apr-2",
          name: "Highlight film",
          status: "in_progress",
          dueDate: "2026-07-20",
        },
        {
          id: "del-apr-3",
          name: "Printed album",
          status: "in_progress",
          dueDate: "2026-07-30",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0009",
    name: "May 2026",
    workspaceId: "weddings",
    subcategoryId: "weddings-upcoming",
    clientName: "Mamdouh El-Sayed",
    status: "Active",
    progress: 42,
    ordersCount: 1,
    revenue: 95000,
    team: [team.sara, team.nora, team.omar],
    upcomingShoots: [
      {
        id: "shoot-may-1",
        title: "Pre-wedding consult",
        date: "2026-07-15",
        location: "SODA Studio A, Maadi",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-03T12:00:00Z",
    description: "May wedding at Marriott Mena House — pyramids backdrop ceremony.",
    createdAt: "2026-01-08T09:00:00Z",
    updatedAt: "2026-07-03T12:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Full wedding coverage for Mamdouh El-Sayed at Marriott Mena House with second shooter.",
        milestones: [
          "Deposit received",
          "Venue walkthrough done",
          "Ceremony scheduled May 22",
        ],
        nextAction: "Pre-wedding consult July 15 — confirm drone permissions.",
      },
      orders: [
        {
          id: "SODA-2026-0005",
          clientName: "Mamdouh El-Sayed",
          status: "Scheduled",
          shootDate: "2026-05-22",
          price: 95000,
        },
      ],
      calendar: [
        {
          id: "cal-may-1",
          title: "Pre-wedding consult",
          startsAt: "2026-07-15T18:00:00Z",
          kind: "internal",
          location: "SODA Studio A, Maadi",
        },
        {
          id: "cal-may-2",
          title: "Wedding day",
          startsAt: "2026-05-22T10:00:00Z",
          kind: "shoot",
          location: "Marriott Mena House, Giza",
        },
      ],
      files: [
        {
          id: "file-may-1",
          name: "MenaHouse_FloorPlan.pdf",
          type: "PDF",
          size: "2.4 MB",
          updatedAt: "2026-06-01T10:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-may-1",
          label: "Wedding deposit",
          amount: 30000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-01-20",
        },
        {
          id: "pay-may-2",
          label: "Final balance",
          amount: 65000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-may-1",
          title: "Booked",
          description: "May wedding package confirmed.",
          date: "2026-01-08",
          type: "milestone",
        },
        {
          id: "tl-may-2",
          title: "Venue walkthrough",
          description: "Scouted Marriott Mena House ceremony spaces.",
          date: "2026-06-15",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-may-1",
          author: "Sara Nabil",
          body: "Need second shooter for cocktail hour — Nora confirmed.",
          createdAt: "2026-07-03T12:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-may-1",
          actor: "Sara Nabil",
          action: "Confirmed second shooter assignment",
          createdAt: "2026-07-03T12:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-may-1",
          name: "Same-day teaser",
          status: "pending",
          dueDate: "2026-05-23",
        },
        {
          id: "del-may-2",
          name: "Highlight film + album",
          status: "pending",
          dueDate: "2026-07-01",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0010",
    name: "June 2026",
    workspaceId: "weddings",
    subcategoryId: "weddings-upcoming",
    clientName: "Karim & Dina",
    status: "Active",
    progress: 25,
    ordersCount: 1,
    revenue: 110000,
    team: [team.sara, team.nora, team.karim, team.layla],
    upcomingShoots: [
      {
        id: "shoot-jun-1",
        title: "Henna night",
        date: "2026-06-11",
        location: "St. Regis Almasa Hotel, New Cairo",
        status: "Pending",
      },
      {
        id: "shoot-jun-2",
        title: "Wedding day",
        date: "2026-06-12",
        location: "St. Regis Almasa Hotel, New Cairo",
        status: "Pending",
      },
    ],
    lastActivity: "2026-07-01T09:00:00Z",
    description: "Two-day June celebration — henna night and wedding day.",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-07-01T09:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Two-day wedding package for Karim & Dina at St. Regis Almasa.",
        milestones: [
          "Deposit received",
          "Timeline draft shared",
        ],
        nextAction: "Send detailed shot list for henna night.",
      },
      orders: [
        {
          id: "SODA-2026-0009",
          clientName: "Karim & Dina",
          status: "Pending",
          shootDate: "2026-06-12",
          price: 110000,
        },
      ],
      calendar: [
        {
          id: "cal-jun-1",
          title: "Henna night",
          startsAt: "2026-06-11T16:00:00Z",
          kind: "shoot",
          location: "St. Regis Almasa Hotel, New Cairo",
        },
        {
          id: "cal-jun-2",
          title: "Wedding day",
          startsAt: "2026-06-12T10:00:00Z",
          kind: "shoot",
          location: "St. Regis Almasa Hotel, New Cairo",
        },
      ],
      files: [
        {
          id: "file-jun-1",
          name: "June_Wedding_Timeline_Draft.pdf",
          type: "PDF",
          size: "680 KB",
          updatedAt: "2026-07-01T09:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-jun-1",
          label: "Wedding deposit",
          amount: 35000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-02-15",
        },
        {
          id: "pay-jun-2",
          label: "Final balance",
          amount: 75000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-jun-1",
          title: "Booked",
          description: "June two-day package confirmed.",
          date: "2026-02-01",
          type: "milestone",
        },
      ],
      notes: [
        {
          id: "note-jun-1",
          author: "Dina Farid",
          body: "Couple requested cinematic film + traditional stills mix.",
          createdAt: "2026-07-01T09:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-jun-1",
          actor: "Dina Farid",
          action: "Shared timeline draft with couple",
          createdAt: "2026-07-01T09:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-jun-1",
          name: "Henna night gallery",
          status: "pending",
          dueDate: "2026-06-25",
        },
        {
          id: "del-jun-2",
          name: "Wedding film + album",
          status: "pending",
          dueDate: "2026-08-01",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0011",
    name: "Summer Collection",
    workspaceId: "fashion",
    clientName: "Cairo Fashion Week",
    status: "Active",
    progress: 55,
    ordersCount: 2,
    revenue: 87000,
    team: [team.sara, team.karim, team.nora, team.youssef],
    upcomingShoots: [
      {
        id: "shoot-sc-1",
        title: "Lookbook day 2",
        date: "2026-07-17",
        location: "SODA Studio A, Maadi",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-08T20:00:00Z",
    description: "Summer lookbook and runway coverage for fashion clients.",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-07-08T20:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Fashion summer collection covering lookbook stills and runway event coverage.",
        milestones: [
          "Lookbook day 1 complete",
          "Runway coverage delivered",
        ],
        nextAction: "Lookbook day 2 — remaining 12 looks.",
      },
      orders: [
        {
          id: "SODA-2026-0012",
          clientName: "Cairo Fashion Week",
          status: "Shooting",
          shootDate: "2026-03-28",
          price: 78000,
        },
        {
          id: "SODA-2026-0004",
          clientName: "Nour Hassan",
          status: "Pending",
          shootDate: "2026-04-05",
          price: 7500,
        },
      ],
      calendar: [
        {
          id: "cal-sc-1",
          title: "Lookbook day 2",
          startsAt: "2026-07-17T09:00:00Z",
          kind: "shoot",
          location: "SODA Studio A, Maadi",
        },
      ],
      files: [
        {
          id: "file-sc-1",
          name: "Lookbook_Day1_Selects.zip",
          type: "Archive",
          size: "2.9 GB",
          updatedAt: "2026-07-01T18:00:00Z",
        },
        {
          id: "file-sc-2",
          name: "CFW_Runway_Highlights.mp4",
          type: "Video",
          size: "4.5 GB",
          updatedAt: "2026-04-10T12:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-sc-1",
          label: "Runway deposit",
          amount: 26000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-03-01",
        },
        {
          id: "pay-sc-2",
          label: "Runway final",
          amount: 52000,
          kind: "final",
          status: "paid",
          paidAt: "2026-04-12",
        },
        {
          id: "pay-sc-3",
          label: "Lookbook installment",
          amount: 9000,
          kind: "installment",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-sc-1",
          title: "Fashion slate opened",
          description: "Summer Collection project created.",
          date: "2026-03-01",
          type: "milestone",
        },
        {
          id: "tl-sc-2",
          title: "Runway delivered",
          description: "Cairo Fashion Week coverage signed off.",
          date: "2026-04-10",
          type: "delivery",
        },
      ],
      notes: [
        {
          id: "note-sc-1",
          author: "Sara Nabil",
          body: "Stylist bringing extra silk looks — need softbox kit.",
          createdAt: "2026-07-08T20:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-sc-1",
          actor: "Sara Nabil",
          action: "Scheduled lookbook day 2",
          createdAt: "2026-07-08T20:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-sc-1",
          name: "Runway highlights",
          status: "delivered",
          dueDate: "2026-04-10",
        },
        {
          id: "del-sc-2",
          name: "Summer lookbook set",
          status: "in_progress",
          dueDate: "2026-07-28",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0012",
    name: "Cosmetics Shoot",
    workspaceId: "product",
    clientName: "Nile Foods Co.",
    status: "Completed",
    progress: 100,
    ordersCount: 1,
    revenue: 32000,
    team: [team.youssef, team.layla],
    upcomingShoots: [],
    lastActivity: "2026-01-25T14:00:00Z",
    description: "E-commerce cosmetics and product catalog photography.",
    createdAt: "2025-12-20T09:00:00Z",
    updatedAt: "2026-01-25T14:00:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "Product catalog shoot for cosmetics SKUs — white background e-commerce pack.",
        milestones: [
          "50 SKUs captured",
          "Retouching complete",
          "Package delivered",
        ],
        nextAction: "Archive project files to cold storage.",
      },
      orders: [
        {
          id: "SODA-2026-0008",
          clientName: "Nile Foods Co.",
          status: "Delivered",
          shootDate: "2026-01-10",
          price: 32000,
        },
      ],
      calendar: [
        {
          id: "cal-cs-1",
          title: "Catalog delivery",
          startsAt: "2026-01-25T12:00:00Z",
          kind: "delivery",
        },
      ],
      files: [
        {
          id: "file-cs-1",
          name: "Cosmetics_Catalog_Final.zip",
          type: "Archive",
          size: "6.2 GB",
          updatedAt: "2026-01-25T14:00:00Z",
        },
      ],
      payments: [
        {
          id: "pay-cs-1",
          label: "Deposit",
          amount: 10000,
          kind: "deposit",
          status: "paid",
          paidAt: "2025-12-28",
        },
        {
          id: "pay-cs-2",
          label: "Final",
          amount: 22000,
          kind: "final",
          status: "paid",
          paidAt: "2026-01-26",
        },
      ],
      timeline: [
        {
          id: "tl-cs-1",
          title: "Shoot complete",
          description: "All SKUs captured in studio.",
          date: "2026-01-10",
          type: "ops",
        },
        {
          id: "tl-cs-2",
          title: "Delivered",
          description: "Final catalog package sent to client.",
          date: "2026-01-25",
          type: "delivery",
        },
      ],
      notes: [
        {
          id: "note-cs-1",
          author: "Layla Mansour",
          body: "Client approved all retouches on first round.",
          createdAt: "2026-01-24T11:00:00Z",
        },
      ],
      activity: [
        {
          id: "act-cs-1",
          actor: "Layla Mansour",
          action: "Marked Cosmetics Shoot as delivered",
          createdAt: "2026-01-25T14:00:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-cs-1",
          name: "E-commerce catalog pack",
          status: "delivered",
          dueDate: "2026-01-25",
        },
      ],
    }),
  },
  {
    id: "PRJ-2026-0013",
    name: "Tech Conference",
    workspaceId: "events",
    clientName: "TechVentures Egypt",
    status: "Active",
    progress: 70,
    ordersCount: 1,
    revenue: 45000,
    team: [team.karim, team.omar, team.nora, team.ahmed],
    upcomingShoots: [
      {
        id: "shoot-tc-1",
        title: "Highlight reel delivery",
        date: "2026-07-11",
        location: "Remote",
        status: "Scheduled",
      },
    ],
    lastActivity: "2026-07-09T11:30:00Z",
    description: "Annual startup summit — multi-camera coverage and live stream.",
    createdAt: "2026-01-05T09:00:00Z",
    updatedAt: "2026-07-09T11:30:00Z",
    isActive: true,
    ...hubDefaults({
      overview: {
        summary:
          "TechVentures annual summit coverage with multi-camera live stream and highlight reel.",
        milestones: [
          "Event day complete",
          "Raw footage ingested",
          "Highlight reel in edit",
        ],
        nextAction: "Deliver highlight reel by July 11.",
      },
      orders: [
        {
          id: "SODA-2026-0006",
          clientName: "TechVentures Egypt",
          status: "Shooting",
          shootDate: "2026-02-14",
          price: 45000,
        },
      ],
      calendar: [
        {
          id: "cal-tc-1",
          title: "Highlight reel delivery",
          startsAt: "2026-07-11T17:00:00Z",
          kind: "delivery",
        },
      ],
      files: [
        {
          id: "file-tc-1",
          name: "Summit_Raw_CamA.mp4",
          type: "Video",
          size: "48 GB",
          updatedAt: "2026-02-15T08:00:00Z",
        },
        {
          id: "file-tc-2",
          name: "Highlight_RoughCut_v3.mp4",
          type: "Video",
          size: "2.1 GB",
          updatedAt: "2026-07-09T11:30:00Z",
        },
      ],
      payments: [
        {
          id: "pay-tc-1",
          label: "Event deposit",
          amount: 15000,
          kind: "deposit",
          status: "paid",
          paidAt: "2026-01-15",
        },
        {
          id: "pay-tc-2",
          label: "Final balance",
          amount: 30000,
          kind: "final",
          status: "pending",
        },
      ],
      timeline: [
        {
          id: "tl-tc-1",
          title: "Event day",
          description: "Multi-camera coverage at Greek Campus.",
          date: "2026-02-14",
          type: "ops",
        },
        {
          id: "tl-tc-2",
          title: "Edit in progress",
          description: "Highlight reel rough cut v3 shared internally.",
          date: "2026-07-09",
          type: "ops",
        },
      ],
      notes: [
        {
          id: "note-tc-1",
          author: "Karim Fouad",
          body: "Client wants keynote soundbites prioritized in the reel.",
          createdAt: "2026-07-09T11:30:00Z",
        },
      ],
      activity: [
        {
          id: "act-tc-1",
          actor: "Karim Fouad",
          action: "Uploaded Highlight_RoughCut_v3.mp4",
          createdAt: "2026-07-09T11:30:00Z",
        },
      ],
      deliverables: [
        {
          id: "del-tc-1",
          name: "Event photo gallery",
          status: "delivered",
          dueDate: "2026-02-28",
        },
        {
          id: "del-tc-2",
          name: "Highlight reel",
          status: "in_progress",
          dueDate: "2026-07-11",
        },
      ],
    }),
  },
];
