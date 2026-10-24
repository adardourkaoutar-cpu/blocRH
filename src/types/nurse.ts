export type Specialite = 
  | 'IAR' 
  | 'IP' 
  | 'ISM' 
  | 'IBO';

export type Fonction = 
  | 'Anesthésiste' 
  | 'Aide-opératoire' 
  | 'Panseur' 
  | 'Stérilisation';

export type EtatMarital = 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf(ve)';

export type Grade = 
  | 'Infirmier 2ème Grade' 
  | 'Infirmier 1er Grade' 
  | 'Infirmier Principal' 
  | 'Infirmier en Chef' 
  | 'Cadre Supérieur de Santé';

export type EtatFonctionPublique = 
  | 'Fonctionnaire Titulaire' 
  | 'Stagiaire' 
  | 'Mis en Disponibilité' 
  | 'Sous le Drapeau' 
  | 'Contractuel';

export type SituationActuelle = 
  | 'Système normal' 
  | 'Système de garde' 
  | 'Congé administratif' 
  | 'Congé de maladie' 
  | 'Congé exceptionnel' 
  | 'Mis en disponibilité' 
  | 'Sous drapeau';

export interface CongeAdminData {
  limiteAnnuelle: number; // Toujours 22 jours par défaut
  joursReportes: number; // Reliquat de l'année précédente
  joursConsommes: number;
}

export interface CongeMaladieData {
  limiteAnnuelleMois: number; // 3 mois (90 jours)
  joursConsommes: number;
}

export interface NurseStaff {
  id: string;
  nom: string;
  prenom: string;
  ppr: string; // Numéro de Poste Budgétaire / Matricule financier
  cni: string; // Numéro de Carte Nationale d'Identité
  specialite: Specialite;
  fonction: Fonction;
  dateNaissance: string; // YYYY-MM-DD
  lieuNaissance: string;
  etatMarital: EtatMarital;
  nombreEnfants: number;
  grade: Grade;
  dateRecrutement: string; // YYYY-MM-DD
  etatFonctionPublique: EtatFonctionPublique;
  lieuResidence: string;
  navette: boolean; // Faisant la navette ou non
  trajetNavette?: string; // Ex: Rabat - Casablanca
  congeAdmin: CongeAdminData;
  congeMaladie: CongeMaladieData;
  situationActuelle: SituationActuelle;
  email?: string;
  notes?: string;
}

export type TypeConge = 
  | 'Congé Administratif' 
  | 'Congé de Maladie' 
  | 'Congé Exceptionnel' 
  | 'Maternité / Paternité' 
  | 'Pèlerinage' 
  | 'Mariage / Événement Familial';

export type EtatDemande = 'En attente' | 'Confirmé' | 'Refusé';

export type StatutDecision = 'Non reçue' | 'En cours de visa' | 'Reçue et visée';

export interface DemandeConge {
  id: string;
  nurseId: string;
  typeConge: TypeConge;
  dateDemande: string; // YYYY-MM-DD
  dateCessation: string; // Date de départ effectif / cessation
  dateReprisePrevue: string; // Date de reprise prévue
  dateRepriseEffective?: string; // Date réelle de reprise constatée
  nombreJours: number;
  etatDemande: EtatDemande;
  decisionRecue: StatutDecision;
  numeroDecision?: string; // Ex: "DEC-BO-2026/089"
  remplacantId?: string;
  motif?: string;
  observations?: string;
}

export interface ReminderItem {
  id: string;
  type: 'reprise_imminente' | 'reprise_retard' | 'cessation_imminente' | 'decision_manquante' | 'reliquat_eleve' | 'maladie_limite';
  niveau: 'urgent' | 'attention' | 'info';
  titre: string;
  message: string;
  nurseId: string;
  demandeId?: string;
  dateCible: string;
  actionPossible?: 'confirmer_reprise' | 'marquer_decision' | 'voir_agent';
}
