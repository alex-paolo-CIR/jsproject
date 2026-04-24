//index


//merch
const merchPresets = [
	{
		name: "Grey Unit",
		skin: "#b8b0a3",
		suit: "#3a3c42",
		accent: "#1f2228",
		hair: "#1c1d21",
		shoe: "#111215",
		eyes: "#f5f5f5",
	},
	{
		name: "Concrete",
		skin: "#a7a29c",
		suit: "#5a5d63",
		accent: "#2f3136",
		hair: "#282a30",
		shoe: "#181a1d",
		eyes: "#f2f2f2",
	},
	{
		name: "Steel",
		skin: "#9fa5ad",
		suit: "#44484f",
		accent: "#23262b",
		hair: "#121418",
		shoe: "#101114",
		eyes: "#f8f8f8",
	},
	{
		name: "Dust",
		skin: "#c1aa91",
		suit: "#50545a",
		accent: "#2d3035",
		hair: "#3a2f28",
		shoe: "#17181b",
		eyes: "#fcfcfc",
	},
	{
		name: "Night Shift",
		skin: "#8f8b87",
		suit: "#2f3237",
		accent: "#15171a",
		hair: "#0f1012",
		shoe: "#090a0c",
		eyes: "#f0f0f0",
	},
];

const merchHeadPresets = [
	{
		name: "Casquette",
		capVisible: true,
		capImage: "images/avatar/cap.svg",
		capScale: "1.1",
		capOffsetY: "-8px",
		headColor: "#c7ccd2",
		headLabel: "Casquette",
	},
	{
		name: "Cheveux courts",
		capVisible: false,
		capImage: "",
		capScale: "1",
		capOffsetY: "0px",
		headColor: "#b8b0a3",
		headLabel: "Cheveux",
	},
	{
		name: "Bonnet",
		capVisible: true,
		capImage: "images/avatar/beanie.svg",
		capScale: "1.08",
		capOffsetY: "-8px",
		headColor: "#b8b0a3",
		headLabel: "Bonnet",
	},
];

const merchTopPresets = [
	{
		name: "T-shirt",
		color: "#2f6fdd",
		accent: "#17386f",
		topImage: "images/avatar/tshirt.svg",
		length: "154px",
		armSleeveLength: "44%",
		armAngle: "8deg",
	},
	{
		name: "Pull",
		color: "#a3473a",
		accent: "#5a241d",
		topImage: "images/avatar/pull.svg",
		length: "182px",
		armSleeveLength: "100%",
		armAngle: "4deg",
	},
];

const merchBottomPresets = [
	{
		name: "Pantalon",
		color: "#2e4f86",
		bottomImage: "images/avatar/pants.svg",
		length: "152px",
		offset: "338px",
		legClothLength: "100%",
	},
	{
		name: "Short",
		color: "#3d8a61",
		bottomImage: "images/avatar/shorts.svg",
		length: "92px",
		offset: "396px",
		legClothLength: "40%",
	},
];

function initMerchBuilder() {
	const avatar = document.getElementById("avatar");
	const avatarName = document.getElementById("avatar-name");
	const headChoice = document.getElementById("head-choice");
	const topChoice = document.getElementById("top-choice");
	const bottomChoice = document.getElementById("bottom-choice");
	const controls = document.querySelector(".avatar-controls");
	const capElement = document.querySelector(".avatar-cap");
	const topElement = document.querySelector(".avatar-top-layer");
	const bottomElement = document.querySelector(".avatar-bottom-layer");
	const headElement = document.querySelector(".avatar-head");
	const headChoiceRow = document.querySelector('.avatar-choice[data-choice="head"]');
	const topChoiceRow = document.querySelector('.avatar-choice[data-choice="top"]');
	const bottomChoiceRow = document.querySelector('.avatar-choice[data-choice="bottom"]');

	if (!avatar || !avatarName || !headChoice || !topChoice || !bottomChoice || !controls || !capElement || !topElement || !bottomElement || !headElement || !headChoiceRow || !topChoiceRow || !bottomChoiceRow) {
		return;
	}

	const state = {
		skinIndex: 0,
		headEnabled: true,
		headIndex: 0,
		topEnabled: true,
		topIndex: 0,
		bottomEnabled: true,
		bottomIndex: 0,
	};

	function renderMerchAvatar() {
		const skin = merchPresets[state.skinIndex];
		const headPreset = merchHeadPresets[state.headIndex];
		const topPreset = merchTopPresets[state.topIndex];
		const bottomPreset = merchBottomPresets[state.bottomIndex];
		const headLabel = state.headEnabled ? headPreset.name : "Sans tete";
		const topLabel = topPreset.name;
		const bottomLabel = bottomPreset.name;

		avatar.style.setProperty("--avatar-skin", skin.skin);
		avatar.style.setProperty("--avatar-head-opacity", state.headEnabled ? "1" : "0.25");
		avatar.style.setProperty("--avatar-cap-opacity", state.headEnabled && headPreset.capVisible ? "1" : "0");
		avatar.style.setProperty("--avatar-cap-image", headPreset.capVisible && headPreset.capImage ? `url('${headPreset.capImage}')` : "none");
		avatar.style.setProperty("--avatar-cap-scale", headPreset.capScale || "1");
		avatar.style.setProperty("--avatar-cap-offset-y", headPreset.capOffsetY || "0px");
		avatar.style.setProperty("--avatar-head-color", skin.skin);
		avatar.style.setProperty("--avatar-top", topPreset.color);
		avatar.style.setProperty("--avatar-top-image", topPreset.topImage ? `url('${topPreset.topImage}')` : "none");
		avatar.style.setProperty("--avatar-bottom", bottomPreset.color);
		avatar.style.setProperty("--avatar-bottom-image", bottomPreset.bottomImage ? `url('${bottomPreset.bottomImage}')` : "none");
		avatar.style.setProperty("--avatar-accent", topPreset.accent);
		avatar.style.setProperty("--avatar-shoe", skin.shoe);
		avatar.style.setProperty("--avatar-eyes", skin.eyes);
		avatar.style.setProperty("--avatar-top-length", topPreset.length);
		avatar.style.setProperty("--avatar-arm-angle", topPreset.armAngle);
		avatar.style.setProperty("--avatar-arm-sleeve-length", topPreset.armSleeveLength || "100%");
		avatar.style.setProperty("--avatar-bottom-length", bottomPreset.length);
		avatar.style.setProperty("--avatar-bottom-offset", bottomPreset.offset);
		avatar.style.setProperty("--avatar-leg-cloth-length", bottomPreset.legClothLength || "100%");
		avatar.style.setProperty("--avatar-head-opacity", state.headEnabled ? "1" : "0.18");
		headChoiceRow.classList.toggle("is-hidden", !state.headEnabled);
		topChoiceRow.classList.toggle("is-hidden", !state.topEnabled);
		bottomChoiceRow.classList.toggle("is-hidden", !state.bottomEnabled);
		headChoice.textContent = headPreset.name;
		topChoice.textContent = topLabel;
		bottomChoice.textContent = bottomLabel;
		headElement.style.background = `radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.16), transparent 24%), ${skin.skin}`;
		avatarName.textContent = `${headLabel} / ${topLabel} / ${bottomLabel}`;
	}

	controls.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-merch-action]");
		if (!button) {
			return;
		}

		const action = button.dataset.merchAction;

		if (action === "head-off") {
			state.headEnabled = false;
		}
		if (action === "head-on") {
			state.headEnabled = true;
		}
		if (action === "top-off") {
			state.topEnabled = false;
		}
		if (action === "top-on") {
			state.topEnabled = true;
		}
		if (action === "bottom-off") {
			state.bottomEnabled = false;
		}
		if (action === "bottom-on") {
			state.bottomEnabled = true;
		}
		if (action === "head-prev") {
			state.headIndex = (state.headIndex - 1 + merchHeadPresets.length) % merchHeadPresets.length;
			state.headEnabled = true;
		}
		if (action === "head-next") {
			state.headIndex = (state.headIndex + 1) % merchHeadPresets.length;
			state.headEnabled = true;
		}
		if (action === "top-prev") {
			state.topIndex = (state.topIndex - 1 + merchTopPresets.length) % merchTopPresets.length;
			state.topEnabled = true;
		}
		if (action === "top-next") {
			state.topIndex = (state.topIndex + 1) % merchTopPresets.length;
			state.topEnabled = true;
		}
		if (action === "bottom-prev") {
			state.bottomIndex = (state.bottomIndex - 1 + merchBottomPresets.length) % merchBottomPresets.length;
			state.bottomEnabled = true;
		}
		if (action === "bottom-next") {
			state.bottomIndex = (state.bottomIndex + 1) % merchBottomPresets.length;
			state.bottomEnabled = true;
		}
		if (action === "randomize") {
			state.skinIndex = Math.floor(Math.random() * merchPresets.length);
			state.headIndex = Math.floor(Math.random() * merchHeadPresets.length);
			state.topIndex = Math.floor(Math.random() * merchTopPresets.length);
			state.bottomIndex = Math.floor(Math.random() * merchBottomPresets.length);
			state.headEnabled = Math.random() > 0.25;
			state.topEnabled = Math.random() > 0.2;
			state.bottomEnabled = Math.random() > 0.2;
		}

		renderMerchAvatar();
	});

	renderMerchAvatar();
}

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

document.addEventListener("DOMContentLoaded", () => {
	renderUpcomingEvents();
	initMerchBuilder();
});
