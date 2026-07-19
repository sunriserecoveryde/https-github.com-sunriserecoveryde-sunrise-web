import { Router, type IRouter } from "express";
import { BEDS, PATIENTS } from "../data/census";

const WD_THRESHOLD = 13;

function isWithdrawalAlert(p: (typeof PATIENTS)[number]) {
  return (
    (p.cows != null && p.cows >= WD_THRESHOLD) ||
    (p.ciwa != null && p.ciwa >= WD_THRESHOLD)
  );
}

const router: IRouter = Router();

router.get("/census", (_req, res) => {
  const residentialPatients = PATIENTS.filter((p) => p.bed != null);

  const stats = {
    occupied: BEDS.filter((b) => b.status === "Occupied").length,
    available: BEDS.filter((b) => b.status === "Available").length,
    cleaning: BEDS.filter((b) => b.status === "Cleaning").length,
    wdAlerts: residentialPatients.filter(isWithdrawalAlert).length,
  };

  res.json({ beds: BEDS, patients: PATIENTS, stats });
});

export default router;
