import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { InterestRatesByTerm } from "../types";
import { TrendingUp, Save } from "lucide-react";

interface InterestRateSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRates: InterestRatesByTerm;
  onSave: (rates: InterestRatesByTerm) => void;
}

const InterestRateSettings = ({
  open,
  onOpenChange,
  currentRates,
  onSave,
}: InterestRateSettingsProps) => {
  const [rate3, setRate3] = useState(currentRates["3"].toString());
  const [rate6, setRate6] = useState(currentRates["6"].toString());
  const [rate12, setRate12] = useState(currentRates["12"].toString());
  const [saving, setSaving] = useState(false);

  // Update local state when currentRates change
  useEffect(() => {
    setRate3(currentRates["3"].toString());
    setRate6(currentRates["6"].toString());
    setRate12(currentRates["12"].toString());
  }, [currentRates]);

  const handleSave = async () => {
    setSaving(true);
    
    const newRates: InterestRatesByTerm = {
      "3": parseFloat(rate3),
      "6": parseFloat(rate6),
      "12": parseFloat(rate12),
    };

    await onSave(newRates);
    setSaving(false);
    onOpenChange(false);
  };

  const hasChanges = 
    parseFloat(rate3) !== currentRates["3"] ||
    parseFloat(rate6) !== currentRates["6"] ||
    parseFloat(rate12) !== currentRates["12"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Interest Rate Settings
          </DialogTitle>
          <DialogDescription>
            Update your interest rates for each repayment term. Changes will apply to all new loan requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Rates Display */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Current Rates</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">3 months:</span>
                <span className="font-semibold ml-1">{currentRates["3"]}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">6 months:</span>
                <span className="font-semibold ml-1">{currentRates["6"]}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">12 months:</span>
                <span className="font-semibold ml-1">{currentRates["12"]}%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rate Inputs */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">New Rates</h4>
            
            <div>
              <Label htmlFor="rate3">3 Months Interest Rate (%)</Label>
              <Input
                id="rate3"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={rate3}
                onChange={(e) => setRate3(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rate for 3-month repayment term
              </p>
            </div>

            <div>
              <Label htmlFor="rate6">6 Months Interest Rate (%)</Label>
              <Input
                id="rate6"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={rate6}
                onChange={(e) => setRate6(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rate for 6-month repayment term
              </p>
            </div>

            <div>
              <Label htmlFor="rate12">12 Months Interest Rate (%)</Label>
              <Input
                id="rate12"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={rate12}
                onChange={(e) => setRate12(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rate for 12-month repayment term
              </p>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          {hasChanges && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Preview Changes
              </h4>
              <div className="space-y-1 text-sm">
                {parseFloat(rate3) !== currentRates["3"] && (
                  <div className="flex justify-between">
                    <span>3 months:</span>
                    <span>
                      <span className="text-muted-foreground line-through">{currentRates["3"]}%</span>
                      <span className="text-primary font-semibold ml-2">{rate3}%</span>
                    </span>
                  </div>
                )}
                {parseFloat(rate6) !== currentRates["6"] && (
                  <div className="flex justify-between">
                    <span>6 months:</span>
                    <span>
                      <span className="text-muted-foreground line-through">{currentRates["6"]}%</span>
                      <span className="text-primary font-semibold ml-2">{rate6}%</span>
                    </span>
                  </div>
                )}
                {parseFloat(rate12) !== currentRates["12"] && (
                  <div className="flex justify-between">
                    <span>12 months:</span>
                    <span>
                      <span className="text-muted-foreground line-through">{currentRates["12"]}%</span>
                      <span className="text-primary font-semibold ml-2">{rate12}%</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Warning */}
          <p className="text-xs text-muted-foreground text-center">
            Note: Changes will only affect new loan requests. Existing loans will keep their original rates.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterestRateSettings;
