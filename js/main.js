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
	},
	{
		name: "Cheveux courts",
		capVisible: false,
		capImage: "",
		capScale: "1",
		capOffsetY: "0px",
		headColor: "#b8b0a3",
	},
	{
		name: "Bonnet",
		capVisible: true,
		capImage: "images/avatar/beanie.svg",
		capScale: "1.08",
		capOffsetY: "-8px",
		headColor: "#b8b0a3",
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

function createDownloadLink(filename, content) {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

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

	const defaultState = {
		skinIndex: 0,
		headEnabled: true,
		headIndex: 0,
		topEnabled: true,
		topIndex: 0,
		bottomEnabled: true,
		bottomIndex: 0,
	};

	const state = { ...defaultState };

	function exportUnit() {
		const skin = merchPresets[state.skinIndex];
		const headPreset = merchHeadPresets[state.headIndex];
		const topPreset = merchTopPresets[state.topIndex];
		const bottomPreset = merchBottomPresets[state.bottomIndex];
		const lines = [
			"dash. merch lab",
			`skin: ${skin.name}`,
			`head: ${state.headEnabled ? headPreset.name : "Sans tete"}`,
			`top: ${state.topEnabled ? topPreset.name : "Sans haut"}`,
			`bottom: ${state.bottomEnabled ? bottomPreset.name : "Sans bas"}`,
		];

		createDownloadLink("dash-merch-unit.txt", lines.join("\n"));
	}

	function renderMerchAvatar() {
		const skin = merchPresets[state.skinIndex];
		const headPreset = merchHeadPresets[state.headIndex];
		const topPreset = merchTopPresets[state.topIndex];
		const bottomPreset = merchBottomPresets[state.bottomIndex];
		const headLabel = state.headEnabled ? headPreset.name : "Sans tete";
		const topLabel = state.topEnabled ? topPreset.name : "Sans haut";
		const bottomLabel = state.bottomEnabled ? bottomPreset.name : "Sans bas";

		avatar.style.setProperty("--avatar-skin", skin.skin);
		avatar.style.setProperty("--avatar-head-opacity", state.headEnabled ? "1" : "0.18");
		avatar.style.setProperty("--avatar-cap-opacity", state.headEnabled && headPreset.capVisible ? "1" : "0");
		avatar.style.setProperty("--avatar-cap-image", headPreset.capVisible && headPreset.capImage ? `url('${headPreset.capImage}')` : "none");
		avatar.style.setProperty("--avatar-cap-scale", headPreset.capScale || "1");
		avatar.style.setProperty("--avatar-cap-offset-y", headPreset.capOffsetY || "0px");
		avatar.style.setProperty("--avatar-head-color", headPreset.headColor || skin.skin);
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
		headChoiceRow.classList.toggle("is-hidden", !state.headEnabled);
		topChoiceRow.classList.toggle("is-hidden", !state.topEnabled);
		bottomChoiceRow.classList.toggle("is-hidden", !state.bottomEnabled);
		headChoice.textContent = headPreset.name;
		topChoice.textContent = topLabel;
		bottomChoice.textContent = bottomLabel;
		headElement.style.background = `radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.16), transparent 24%), ${headPreset.headColor || skin.skin}`;
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
		} else if (action === "head-on") {
			state.headEnabled = true;
		} else if (action === "top-off") {
			state.topEnabled = false;
		} else if (action === "top-on") {
			state.topEnabled = true;
		} else if (action === "bottom-off") {
			state.bottomEnabled = false;
		} else if (action === "bottom-on") {
			state.bottomEnabled = true;
		} else if (action === "head-prev") {
			state.headIndex = (state.headIndex - 1 + merchHeadPresets.length) % merchHeadPresets.length;
			state.headEnabled = true;
		} else if (action === "head-next") {
			state.headIndex = (state.headIndex + 1) % merchHeadPresets.length;
			state.headEnabled = true;
		} else if (action === "top-prev") {
			state.topIndex = (state.topIndex - 1 + merchTopPresets.length) % merchTopPresets.length;
			state.topEnabled = true;
		} else if (action === "top-next") {
			state.topIndex = (state.topIndex + 1) % merchTopPresets.length;
			state.topEnabled = true;
		} else if (action === "bottom-prev") {
			state.bottomIndex = (state.bottomIndex - 1 + merchBottomPresets.length) % merchBottomPresets.length;
			state.bottomEnabled = true;
		} else if (action === "bottom-next") {
			state.bottomIndex = (state.bottomIndex + 1) % merchBottomPresets.length;
			state.bottomEnabled = true;
		} else if (action === "randomize") {
			state.skinIndex = Math.floor(Math.random() * merchPresets.length);
			state.headIndex = Math.floor(Math.random() * merchHeadPresets.length);
			state.topIndex = Math.floor(Math.random() * merchTopPresets.length);
			state.bottomIndex = Math.floor(Math.random() * merchBottomPresets.length);
			state.headEnabled = Math.random() > 0.25;
			state.topEnabled = Math.random() > 0.2;
			state.bottomEnabled = Math.random() > 0.2;
		} else if (action === "reset") {
			Object.assign(state, defaultState);
		} else if (action === "export") {
			exportUnit();
			return;
		}

		renderMerchAvatar();
	});

	renderMerchAvatar();
}

document.addEventListener("DOMContentLoaded", () => {
	initMerchBuilder();
});
