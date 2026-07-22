"use client";

import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function RecoveryCalculator() {
  const [missed, setMissed] = useState("");
  const [ticket, setTicket] = useState("");
  const [recovery, setRecovery] = useState("25");
  const estimate = useMemo(() => {
    const weeklyCalls = Number(missed);
    const averageTicket = Number(ticket);
    const recoveryRate = Number(recovery);
    if (
      !Number.isFinite(weeklyCalls) ||
      !Number.isFinite(averageTicket) ||
      !Number.isFinite(recoveryRate) ||
      weeklyCalls <= 0 ||
      averageTicket <= 0 ||
      recoveryRate <= 0
    )
      return null;
    return weeklyCalls * 4.33 * averageTicket * (recoveryRate / 100);
  }, [missed, ticket, recovery]);

  return (
    <div className="calculator-card">
      <div className="calculator-inputs">
        <label>
          <span>Missed opportunities / week</span>
          <input
            type="number"
            min="1"
            max="10000"
            inputMode="numeric"
            value={missed}
            onChange={(event) => setMissed(event.target.value)}
            placeholder="Enter your number"
          />
        </label>
        <label>
          <span>Average completed-job value</span>
          <div className="money-input">
            <i>$</i>
            <input
              type="number"
              min="1"
              max="1000000"
              inputMode="decimal"
              value={ticket}
              onChange={(event) => setTicket(event.target.value)}
              placeholder="Enter job value"
            />
          </div>
        </label>
        <label>
          <span>Modeled recovery rate</span>
          <select value={recovery} onChange={(event) => setRecovery(event.target.value)}>
            <option value="10">10% conservative</option>
            <option value="25">25% working target</option>
            <option value="40">40% aggressive</option>
          </select>
        </label>
      </div>
      <div className="calculator-result" aria-live="polite">
        <small>MODELED MONTHLY OPPORTUNITY</small>
        <strong>{estimate === null ? "Add your real numbers" : money.format(estimate)}</strong>
        <p>
          This is a planning estimate, not a promise. Recover attributes only completed,
          provider-verified revenue in the owner workspace.
        </p>
      </div>
    </div>
  );
}
