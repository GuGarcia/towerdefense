/**
 * Builds per-player upgrade bars (life bar, upgrade buttons, money).
 */
import type { UpgradeTypeValue } from "../../domain/player/UpgradeType";

export const UPGRADE_LABELS: Record<string, string> = {
  damage: "Dmg",
  life: "Life",
  regen: "Regen",
  attackSpeed: "Spd",
  range: "Portée",
  armorPercent: "Armure%",
  armorFixed: "Armure",
  thorns: "Thorns",
  critChance: "Crit%",
  critDamage: "CritDmg%",
};

export const UPGRADE_TYPES: readonly UpgradeTypeValue[] = [
  "damage",
  "life",
  "regen",
  "attackSpeed",
  "range",
  "armorPercent",
  "armorFixed",
  "thorns",
  "critChance",
  "critDamage",
] as const;

export interface SetupUpgradeBarsOptions {
  onUpgradeClick: (playerIndex: number, upgradeType: UpgradeTypeValue) => void;
}

export function setupUpgradeBars(
  container: HTMLElement,
  nPlayers: number,
  options: SetupUpgradeBarsOptions
): void {
  const { onUpgradeClick } = options;

  for (let i = 0; i < nPlayers; i++) {
    const bar = document.createElement("div");
    bar.className = "player-upgrade-bar";
    bar.setAttribute("data-player", String(i + 1));

    const lifeBarWrap = document.createElement("div");
    lifeBarWrap.className = "life-bar-wrap";
    const lifeBar = document.createElement("div");
    lifeBar.className = "life-bar";
    const lifeBarFill = document.createElement("div");
    lifeBarFill.className = "life-bar-fill";
    lifeBarFill.style.width = "100%";
    lifeBar.appendChild(lifeBarFill);
    lifeBarWrap.appendChild(lifeBar);
    bar.appendChild(lifeBarWrap);

    const buttonsWrap = document.createElement("div");
    buttonsWrap.className = "upgrade-buttons";
    for (const key of UPGRADE_TYPES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-upgrade", key);
      btn.textContent = `${UPGRADE_LABELS[key]} ($50)`;
      const playerIndex = i;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        onUpgradeClick(playerIndex, key);
      });
      buttonsWrap.appendChild(btn);
    }
    bar.appendChild(buttonsWrap);

    const moneyEl = document.createElement("span");
    moneyEl.className = "player-money";
    moneyEl.textContent = "$ 0";
    bar.appendChild(moneyEl);

    container.appendChild(bar);
  }
}
