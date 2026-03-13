import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { DeductionDefinition } from "@/lib/taxRules";

interface DeductionRowProps {
  definition: DeductionDefinition;
  enabled: boolean;
  amount: number;
  onToggle: (enabled: boolean) => void;
  onAmountChange: (amount: number) => void;
  darkMode?: boolean;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function DeductionRow({
  definition,
  enabled,
  amount,
  onToggle,
  onAmountChange,
  darkMode = false,
}: DeductionRowProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        darkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={enabled}
            onCheckedChange={(checked) => onToggle(checked === true)}
            aria-label={`Enable ${definition.label}`}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className={darkMode ? "text-slate-100" : "text-slate-900"}>{definition.label}</Label>
              {definition.helpText ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-slate-500 hover:text-slate-700" aria-label="Help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">{definition.helpText}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            {definition.eligibilityNote ? (
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{definition.eligibilityNote}</p>
            ) : null}
            {definition.taxYearNote ? (
              <p className={`text-xs ${darkMode ? "text-amber-300" : "text-amber-700"}`}>{definition.taxYearNote}</p>
            ) : null}
          </div>
        </div>

        {enabled ? (
          <div className="w-full md:w-44">
            <Input
              type="number"
              min={0}
              step={50}
              value={Number.isFinite(amount) ? amount : 0}
              onChange={(event) => onAmountChange(nonNegative(Number(event.target.value)))}
              className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
              aria-label={`${definition.label} amount`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

