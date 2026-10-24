import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { DemandeConge, NurseStaff, TypeConge, EtatDemande, StatutDecision } from '../types/nurse';
import { calculateDaysBetween, getSoldeCongeAdmin, getSoldeCongeMaladie } from '../utils/calculations';

interface LeaveFormModalProps {
  nurses: NurseStaff[];
  selectedNurse?: NurseStaff | null;
  onSave: (demande: DemandeConge) => void;
  onClose: () => void;
}

const TYPES_CONGE: TypeConge[] = [
  'Congé Administratif',
  'Congé de Maladie',
  'Congé Exceptionnel',
  'Maternité / Paternité',
  'Pèlerinage',
  'Mariage / Événement Familial',
];

export const LeaveFormModal: React.FC<LeaveFormModalProps> = ({
  nurses,
  selectedNurse,
  onSave,
  onClose,
}) => {
  const [nurseId, setNurseId] = useState(selectedNurse?.id || (nurses.length > 0 ? nurses[0].id : ''));
  const [typeConge, setTypeConge] = useState<TypeConge>('Congé Administratif');
  
  // Date default to current time
  const todayStr = '2026-10-24';
  const tomorrowStr = '2026-10-25';
  const nextWeekStr = '2026-11-03';

  const [dateDemande, setDateDemande] = useState(todayStr);
  const [dateCessation, setDateCessation] = useState(tomorrowStr);
  const [dateReprisePrevue, setDateReprisePrevue] = useState(nextWeekStr);
  const [nombreJours, setNombreJours] = useState<number>(10);

  const [etatDemande, setEtatDemande] = useState<EtatDemande>('Confirmé');
  const [decisionRecue, setDecisionRecue] = useState<StatutDecision>('En cours de visa');
  const [numeroDecision, setNumeroDecision] = useState('');
  const [remplacantId, setRemplacantId] = useState('');
  const [motif, setMotif] = useState('');
  const [observations, setObservations] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active nurse selected
  const currentNurse = nurses.find(n => n.id === nurseId);
  const soldeAdmin = currentNurse ? getSoldeCongeAdmin(currentNurse) : null;
  const soldeMaladie = currentNurse ? getSoldeCongeMaladie(currentNurse) : null;

  // Auto calculate duration in days
  useEffect(() => {
    if (dateCessation && dateReprisePrevue) {
      const days = calculateDaysBetween(dateCessation, dateReprisePrevue);
      setNombreJours(days > 0 ? days : 1);
    }
  }, [dateCessation, dateReprisePrevue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nurseId) {
      setErrorMsg('Veuillez sélectionner un agent.');
      return;
    }
    if (!dateCessation || !dateReprisePrevue) {
      setErrorMsg('Veuillez renseigner les dates de cessation et de reprise.');
      return;
    }
    if (new Date(dateReprisePrevue) <= new Date(dateCessation)) {
      setErrorMsg('La date de reprise doit être postérieure à la date de cessation de service.');
      return;
    }

    const newDemande: DemandeConge = {
      id: `dem-${Date.now()}`,
      nurseId,
      typeConge,
      dateDemande,
      dateCessation,
      dateReprisePrevue,
      nombreJours,
      etatDemande,
      decisionRecue,
      numeroDecision: numeroDecision.trim() || undefined,
      remplacantId: remplacantId || undefined,
      motif: motif.trim() || undefined,
      observations: observations.trim() || undefined,
    };

    onSave(newDemande);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Déclaration / Demande de Congé & Cessation de Service
            </h2>
            <p className="text-xs text-slate-500">
              Service du Bloc Opératoire · Enregistrement administratif
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Sélection Agent */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Infirmier(e) concerné(e) *
            </label>
            <select
              value={nurseId}
              onChange={(e) => setNurseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              {nurses.map(n => (
                <option key={n.id} value={n.id}>
                  {n.nom} {n.prenom} (PPR: {n.ppr}) · {n.specialite} — {n.situationActuelle}
                </option>
              ))}
            </select>
          </div>

          {/* Solde Card for Selected Nurse */}
          {currentNurse && soldeAdmin && soldeMaladie && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-semibold text-slate-800">{currentNurse.nom} {currentNurse.prenom}</span>
                <span className="text-slate-500 ml-1">({currentNurse.grade})</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Solde Admin Restant</div>
                  <div className="font-bold text-teal-800 font-mono tabular-nums">
                    {soldeAdmin.restant} jours / {soldeAdmin.totalAcquis}j
                  </div>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <div className="text-[10px] text-slate-500">Solde Maladie Restant</div>
                  <div className="font-bold text-rose-800 font-mono tabular-nums">
                    {soldeMaladie.restant} jours / 90j
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Type de Congé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Type de Congé *
              </label>
              <select
                value={typeConge}
                onChange={(e) => setTypeConge(e.target.value as TypeConge)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
              >
                {TYPES_CONGE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date de Dépôt de Demande *
              </label>
              <input
                type="date"
                required
                value={dateDemande}
                onChange={(e) => setDateDemande(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Dates de Cessation et Reprise */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-teal-50/40 p-3 rounded-lg border border-teal-100">
            <div>
              <label className="block font-semibold text-teal-900 mb-1">
                Date de Cessation de Service *
              </label>
              <input
                type="date"
                required
                value={dateCessation}
                onChange={(e) => setDateCessation(e.target.value)}
                className="w-full px-3 py-1.5 border border-teal-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
              />
              <span className="text-[10px] text-teal-700">Dernier jour avant départ</span>
            </div>

            <div>
              <label className="block font-semibold text-teal-900 mb-1">
                Date de Reprise Prévue *
              </label>
              <input
                type="date"
                required
                value={dateReprisePrevue}
                onChange={(e) => setDateReprisePrevue(e.target.value)}
                className="w-full px-3 py-1.5 border border-teal-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
              />
              <span className="text-[10px] text-teal-700">Jour effectif de retour au bloc</span>
            </div>

            <div>
              <label className="block font-semibold text-teal-900 mb-1">
                Durée (Jours demandés)
              </label>
              <input
                type="number"
                min="1"
                value={nombreJours}
                onChange={(e) => setNombreJours(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 border border-teal-300 rounded-md bg-white font-mono font-bold tabular-nums text-slate-900"
              />
              <span className="text-[10px] text-teal-700">Calcul automatique</span>
            </div>
          </div>

          {/* 4. États & Décision Administrative */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                État de la Demande *
              </label>
              <select
                value={etatDemande}
                onChange={(e) => setEtatDemande(e.target.value as EtatDemande)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none font-semibold text-teal-900"
              >
                <option value="En attente">En attente</option>
                <option value="Confirmé">Confirmé (Accordé)</option>
                <option value="Refusé">Refusé</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Statut Décision Administrative
              </label>
              <select
                value={decisionRecue}
                onChange={(e) => setDecisionRecue(e.target.value as StatutDecision)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Non reçue">Non reçue</option>
                <option value="En cours de visa">En cours de visa / DRH</option>
                <option value="Reçue et visée">Reçue et visée (Officielle)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                N° de Décision / Visa
              </label>
              <input
                type="text"
                placeholder="Ex: DEC-2026/099"
                value={numeroDecision}
                onChange={(e) => setNumeroDecision(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Remplaçant au bloc & Motif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Remplaçant proposé au bloc (optionnel)
              </label>
              <select
                value={remplacantId}
                onChange={(e) => setRemplacantId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">-- Aucun remplaçant spécifique --</option>
                {nurses.filter(n => n.id !== nurseId).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.nom} {n.prenom} ({n.specialite})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Motif / Justification
              </label>
              <input
                type="text"
                placeholder="Ex: Congé annuel d'automne, certificat médical n°..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Observations de la Major / Chef de service
            </label>
            <textarea
              rows={2}
              placeholder="Avis favorable, aménagement du roulement de garde nécessaire..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              Enregistrer la Demande
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
