import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { useToast } from "../hooks/use-toast";
import { TrendingUp, Save, AlertCircle } from "lucide-react";
import { InterestRatesByTerm } from "../types";

interface GlobalInterestRateSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalInterestRateSettings = ({
  open,
  onOpenChange,
}: GlobalInterestRateSettingsProps) => {
  const [rate3, setRate3] = useState("1");
  const [rate6, setRate6] = useState("1");
  const [rate12, setRate12] = useState("1");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  // Load current global rates (we'll use a default for now)
  useEffect(() => {
    if (open) {
      setLoading(true);
      // For now, we'll use default rates of 1%
      // In a real implementation, you might store global rates in a separate collection
      setRate3("1");
      setRate6("1");
      setRate12("1");
      setLoading(false);
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const newRates: InterestRatesByTerm = {
        "3": parseFloat(rate3),
        "6": parseFloat(rate6),
        "12": parseFloat(rate12),
      };

      // Update all companies with the new global rates
      const companiesSnapshot = await getDocs(collection(db, "companies"));
      const updatePromises = companiesSnapshot.docs.map(async (companyDoc) => {
        await updateDoc(doc(db, "companies", companyDoc.id), {
          interestRates: newRates,
        });
      });

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Global interest rates updated to ${rate3}%, ${rate6}%, ${rate12}% for all companies.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update global interest rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    parseFloat(rate3) !== 1 ||
    parseFloat(rate6) !== 1 ||
    parseFloat(rate12) !== 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Global Interest Rate Settings
          </DialogTitle>
          <DialogDescription>
            Set global interest rates that will apply to all companies. This will update all existing companies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Important:</p>
                <p>This will update interest rates for ALL companies in the system. Existing loans will keep their original rates.</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rate Inputs */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="rate3">3 Months (%)</Label>
              <Input
                id="rate3"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={rate3}
                onChange={(e) => setRate3(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Interest rate for 3-month repayment terms
              </p>
            </div>

            <div>
              <Label htmlFor="rate6">6 Months (%)</Label>
              <Input
                id="rate6"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={rate6}
                onChange={(e) => setRate6(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Interest rate for 6-month repayment terms
              </p>
            </div>

            <div>
              <Label htmlFor="rate12">12 Months (%)</Label>
              <Input
                id="rate12"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={rate12}
                onChange={(e) => setRate12(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Interest rate for 12-month repayment terms
              </p>
            </div>
          </div>

          {/* Preview Changes */}
          {hasChanges && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Preview Changes</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">3 months:</span>
                  <span className="line-through text-muted-foreground">1%</span>
                  <span className="text-primary font-semibold">→ {rate3}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">6 months:</span>
                  <span className="line-through text-muted-foreground">1%</span>
                  <span className="text-primary font-semibold">→ {rate6}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">12 months:</span>
                  <span className="line-through text-muted-foreground">1%</span>
                  <span className="text-primary font-semibold">→ {rate12}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving || loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Updating..." : "Update All Companies"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalInterestRateSettings;
