//index


//merch


//track



//history










//events

const events = [
	{
		name: "Dash. Opening Set",
		city: "Paris",
		venue: "Le Point Ephemere",
		date: "2026-05-10",
	},
	{
		name: "Neon Pulse Night",
		city: "Lyon",
		venue: "Le Sucre",
		date: "2026-05-28",
	},
	{
		name: "Summer Sound Clash",
		city: "Marseille",
		venue: "Dock des Suds",
		date: "2026-06-19",
	},
	{
		name: "Rooftop Session",
		city: "Bordeaux",
		venue: "Iboat",
		date: "2026-07-03",
	},
];

function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString("fr-FR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function getDaysUntil(dateString) {
	const now = new Date();
	const target = new Date(dateString);
	now.setHours(0, 0, 0, 0);
	target.setHours(0, 0, 0, 0);
	const diffMs = target - now;
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function slugify(value) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function toCalendarDate(dateString) {
	return dateString.replaceAll("-", "");
}

function nextDateString(dateString) {
	const date = new Date(`${dateString}T00:00:00`);
	date.setDate(date.getDate() + 1);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatUtcStamp(date = new Date()) {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeIcsText(value) {
	return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function buildGoogleCalendarUrl(event) {
	const start = toCalendarDate(event.date);
	const end = toCalendarDate(nextDateString(event.date));
	const details = `Live a ${event.venue}, ${event.city}.`;
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: event.name,
		dates: `${start}/${end}`,
		location: `${event.venue}, ${event.city}`,
		details,
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsContent(event) {
	const start = toCalendarDate(event.date);
	const end = toCalendarDate(nextDateString(event.date));
	const uid = `${slugify(event.name)}-${start}@dash.events`;
	const summary = escapeIcsText(event.name);
	const location = escapeIcsText(`${event.venue}, ${event.city}`);
	const description = escapeIcsText(`Live a ${event.venue}, ${event.city}.`);

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Dash//Events//FR",
		"CALSCALE:GREGORIAN",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${formatUtcStamp()}`,
		`DTSTART;VALUE=DATE:${start}`,
		`DTEND;VALUE=DATE:${end}`,
		`SUMMARY:${summary}`,
		`LOCATION:${location}`,
		`DESCRIPTION:${description}`,
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");
}

function buildIcsDataUrl(event) {
	const icsContent = buildIcsContent(event);
	return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}

function createCalendarActions(event) {
	const wrapper = document.createElement("div");
	wrapper.className = "calendar-actions";

	const googleLink = document.createElement("a");
	googleLink.className = "calendar-link";
	googleLink.href = buildGoogleCalendarUrl(event);
	googleLink.target = "_blank";
	googleLink.rel = "noopener noreferrer";
	googleLink.textContent = "Google";

	const appleLink = document.createElement("a");
	appleLink.className = "calendar-link";
	appleLink.href = buildIcsDataUrl(event);
	appleLink.textContent = "Apple";

	const icsLink = document.createElement("a");
	icsLink.className = "calendar-link";
	icsLink.href = buildIcsDataUrl(event);
	icsLink.download = `${slugify(event.name)}.ics`;
	icsLink.textContent = "ICS";

	wrapper.appendChild(googleLink);
	wrapper.appendChild(appleLink);
	wrapper.appendChild(icsLink);
	return wrapper;
}

function createEventCard(event) {
	const article = document.createElement("article");
	article.className = "event-card";

	const when = formatDate(event.date);
	const days = getDaysUntil(event.date);
	const countdown = days === 0 ? "Ce soir" : `Dans ${days} jours`;

	article.innerHTML = `
		<p class="event-date">${when}</p>
		<h3>${event.name}</h3>
		<p class="event-location">${event.venue} - ${event.city}</p>
		<p class="event-countdown">${countdown}</p>
	`;

	article.appendChild(createCalendarActions(event));

	return article;
}

function renderUpcomingEvents() {
	const upcomingContainer = document.getElementById("upcoming-events");
	const nextTitle = document.getElementById("next-event-title");
	const nextMeta = document.getElementById("next-event-meta");
	const nextCountdown = document.getElementById("next-event-countdown");
	const nextActions = document.getElementById("next-event-actions");

	if (!upcomingContainer || !nextTitle || !nextMeta || !nextCountdown || !nextActions) {
		return;
	}

	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const upcoming = events
		.filter((event) => {
			const eventDate = new Date(event.date);
			eventDate.setHours(0, 0, 0, 0);
			return eventDate >= now;
		})
		.sort((a, b) => new Date(a.date) - new Date(b.date));

	if (upcoming.length === 0) {
		nextTitle.textContent = "Aucune date annoncee pour le moment";
		nextMeta.textContent = "La prochaine serie sera publiee bientot.";
		nextCountdown.textContent = "";
		nextActions.innerHTML = "";
		upcomingContainer.innerHTML = "";
		return;
	}

	const nextEvent = upcoming[0];
	const daysToNext = getDaysUntil(nextEvent.date);

	nextTitle.textContent = nextEvent.name;
	nextMeta.textContent = `${formatDate(nextEvent.date)} - ${nextEvent.venue}, ${nextEvent.city}`;
	nextCountdown.textContent =
		daysToNext === 0 ? "Annonce: c'est aujourd'hui." : `Annonce: plus que ${daysToNext} jours.`;
	nextActions.innerHTML = "";
	nextActions.appendChild(createCalendarActions(nextEvent));

	upcomingContainer.innerHTML = "";
	upcoming.forEach((event) => {
		upcomingContainer.appendChild(createEventCard(event));
	});
}

document.addEventListener("DOMContentLoaded", renderUpcomingEvents);
