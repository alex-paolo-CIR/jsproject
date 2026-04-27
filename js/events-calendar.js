function padCalendarValue(value) {
  return String(value).padStart(2, "0");
}

function formatCalendarDate(date) {
  return [
    date.getUTCFullYear(),
    padCalendarValue(date.getUTCMonth() + 1),
    padCalendarValue(date.getUTCDate())
  ].join("") + "T" + [
    padCalendarValue(date.getUTCHours()),
    padCalendarValue(date.getUTCMinutes()),
    padCalendarValue(date.getUTCSeconds())
  ].join("") + "Z";
}

function encodeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildIcsHref(event) {
  const now = formatCalendarDate(new Date());
  const uid = `${event.start.getTime()}-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@dash`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//dash//events//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatCalendarDate(event.start)}`,
    `DTEND:${formatCalendarDate(event.end)}`,
    `SUMMARY:${encodeIcsText(event.title)}`,
    `LOCATION:${encodeIcsText(event.location)}`,
    `DESCRIPTION:${encodeIcsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function getCalendarEvent(node) {
  const start = new Date(node.dataset.eventStart || "");
  const end = new Date(node.dataset.eventEnd || "");

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    title: node.dataset.eventTitle || "dash. event",
    location: node.dataset.eventLocation || "",
    description: node.dataset.eventDescription || "",
    start,
    end
  };
}

function buildCalendarLinks(event) {
  const dates = `${formatCalendarDate(event.start)}/${formatCalendarDate(event.end)}`;
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);
  const description = encodeURIComponent(event.description);
  const startIso = encodeURIComponent(event.start.toISOString());
  const endIso = encodeURIComponent(event.end.toISOString());

  return [
    {
      label: "Google",
      href: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${description}&location=${location}`,
      external: true
    },
    {
      label: "Outlook",
      href: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${startIso}&enddt=${endIso}&body=${description}&location=${location}`,
      external: true
    },
    {
      label: "Yahoo",
      href: `https://calendar.yahoo.com/?v=60&title=${title}&st=${formatCalendarDate(event.start)}&et=${formatCalendarDate(event.end)}&desc=${description}&in_loc=${location}`,
      external: true
    },
    {
      label: "Apple / ICS",
      href: buildIcsHref(event),
      download: `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`
    }
  ];
}

function renderCalendarLinks(node) {
  const event = getCalendarEvent(node);
  const target = node.querySelector("[data-calendar-links]");

  if (!event || !target) {
    return;
  }

  const label = document.createElement("p");
  label.className = "calendar-app-label";
  label.textContent = "ajouter au calendrier";
  target.append(label);

  buildCalendarLinks(event).forEach((link) => {
    const anchor = document.createElement("a");
    anchor.className = "calendar-link calendar-link--app";
    anchor.href = link.href;
    anchor.textContent = link.label;

    if (link.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }

    if (link.download) {
      anchor.download = link.download;
    }

    target.append(anchor);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-event-start][data-event-end]").forEach(renderCalendarLinks);
});
