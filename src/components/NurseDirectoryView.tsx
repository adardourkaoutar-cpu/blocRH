import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  HeartPulse, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Download,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { NurseStaff, SituationActuelle } from '../types/nurse';
import { calculateAnciennete, getSoldeCongeAdmin, getSoldeCongeMaladie, formatDateFr } from '../utils/calculations';

interface NurseDirectoryViewProps {
  nurses: NurseStaff[];
  onSelectNurse: (nurse: NurseStaff) => void;
  onEditNurse: (nurse: NurseStaff) => void;
  onDeleteNurse: (id: string) => void;
  onNewNurse: () => void;
  onDeclareLeave: (nurse: NurseStaff) => void;
  initialFilter?: string;
}

export const NurseDirectoryView: React.FC<NurseDirectoryViewProps> = ({
  nurses,
  onSelectNurse,
  onEditNurse,
  onDeleteNurse,
  onNewNurse,
  onDeclareLeave,
  initialFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [situationFilter, setSituationFilter] = useState<string>(initialFilter || 'tous');
  const [specialiteFilter, setSpecialiteFilter] = useState<string>('tous');
  const [navetteFilter, setNavetteFilter] = useState<string>('tous');

  // Filtrage combiné
  const filteredNurses = useMemo(() => {
    return nurses.filter(nurse => {
      // Recherche textuelle
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        nurse.nom.toLowerCase().includes(q) ||
        nurse.prenom.toLowerCase().includes(q) ||
        nurse.ppr.toLowerCase().includes(q) ||
        nurse.cni.toLowerCase().includes(q) ||
        nurse.specialite.toLowerCase().includes(q) ||
        nurse.fonction.toLowerCase().includes(q) ||
        nurse.lieuResidence.toLowerCase().includes(q)
      );

      // Filtre Situation
      let matchSituation = true;
      if (situationFilter === 'normal') {
        matchSituation = nurse.situationActuelle === 'Système normal';
      } else if (situationFilter === 'garde') {
        matchSituation = nurse.situationActuelle === 'Système de garde';
      } else if (situationFilter === 'conge') {
        matchSituation = nurse.situationActuelle.includes('Congé');
      } else if (situationFilter === 'dispo') {
        matchSituation = nurse.situationActuelle === 'Mis en disponibilité' || nurse.situationActuelle === 'Sous drapeau';
      } else if (situationFilter === 'navettiste') {
        matchSituation = nurse.navette === true;
      }

      // Filtre Spécialité
      const matchSpecialite = specialiteFilter === 'tous' || nurse.specialite === specialiteFilter;

      // Filtre Navette
      const matchNavette = navetteFilter === 'tous' || (navetteFilter === 'oui' ? nurse.navette : !nurse.navette);

      return matchSearch && matchSituation && matchSpecialite && matchNavette;
    });
  }, [nurses, searchQuery, situationFilter, specialiteFilter, navetteFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'PPR', 'CNI', 'Nom', 'Prenom', 'Specialite', 'Fonction',
      'Date_Naissance', 'Lieu_Naissance', 'Etat_Marital', 'Enfants',
      'Grade', 'Date_Recrutement', 'Anciennete', 'Statut_Fonction_Publique',
      'Residence', 'Navette', 'Trajet_Navette',
      'Conge_Admin_Droit', 'Conge_Admin_Reporte', 'Conge_Admin_Consomme', 'Conge_Admin_Restant',
      'Conge_Maladie_Consomme_Jours', 'Conge_Maladie_Restant_Jours',
      'Situation_Actuelle'
    ];

    const rows = filteredNurses.map(n => {
      const anc = calculateAnciennete(n.dateRecrutement);
      const soldeAdmin = getSoldeCongeAdmin(n);
      const soldeMaladie = getSoldeCongeMaladie(n);

      return [
        `"${n.ppr}"`,
        `"${n.cni}"`,
        `"${n.nom}"`,
        `"${n.prenom}"`,
        `"${n.specialite}"`,
        `"${n.fonction}"`,
        `"${n.dateNaissance}"`,
        `"${n.lieuNaissance}"`,
        `"${n.etatMarital}"`,
        n.nombreEnfants,
        `"${n.grade}"`,
        `"${n.dateRecrutement}"`,
        `"${anc.texte}"`,
        `"${n.etatFonctionPublique}"`,
        `"${n.lieuResidence}"`,
        n.navette ? 'Oui' : 'Non',
        `"${n.trajetNavette || ''}"`,
        soldeAdmin.droitAnnuel,
        soldeAdmin.reporte,
        soldeAdmin.consomme,
        soldeAdmin.restant,
        soldeMaladie.consomme,
        soldeMaladie.restant,
        `"${n.situationActuelle}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Staff_Infirmier_Bloc_Operatoire_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      
      {/* Search and Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par Nom, PPR, CNI, Spécialité, Ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Action CTAs: CSV Export & Add Nurse */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Exporter CSV ({filteredNurses.length})
            </button>

            <button
              onClick={onNewNurse}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvel Infirmier
            </button>
          </div>

        </div>

        {/* Filter Segmented Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium mr-1">Situation:</span>
          
          <button
            onClick={() => setSituationFilter('tous')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              situationFilter === 'tous'
                ? 'bg-slate-900 text-white font-medium'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({nurses.length})
          </button>

          <button
            onClick={() => setSituationFilter('normal')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              situationFilter === 'normal'
                ? 'bg-emerald-700 text-white font-medium'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Système Normal ({nurses.filter(n => n.situationActuelle === 'Système normal').length})
          </button>

          <button
            onClick={() => setSituationFilter('garde')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              situationFilter === 'garde'
                ? 'bg-amber-700 text-white font-medium'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Garde & Urgences ({nurses.filter(n => n.situationActuelle === 'Système de garde').length})
          </button>

          <button
            onClick={() => setSituationFilter('conge')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              situationFilter === 'conge'
                ? 'bg-indigo-700 text-white font-medium'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            En Congé ({nurses.filter(n => n.situationActuelle.includes('Congé')).length})
          </button>

          <button
            onClick={() => setSituationFilter('dispo')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              situationFilter === 'dispo'
                ? 'bg-slate-700 text-white font-medium'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Disponibilité / Drapeau ({nurses.filter(n => n.situationActuelle === 'Mis en disponibilité' || n.situationActuelle === 'Sous drapeau').length})
          </button>

          <button
            onClick={() => setSituationFilter('navettiste')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              situationFilter === 'navettiste'
                ? 'bg-teal-700 text-white font-medium'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Navettistes ({nurses.filter(n => n.navette).length})
          </button>

          <span className="text-slate-300 mx-1">|</span>
          <span className="text-slate-500 font-medium">Spécialité:</span>
          
          <select
            value={specialiteFilter}
            onChange={(e) => setSpecialiteFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          >
            <option value="tous">Toutes spécialités</option>
            <option value="IAR">IAR</option>
            <option value="IP">IP</option>
            <option value="ISM">ISM</option>
            <option value="IBO">IBO</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        
        {filteredNurses.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">Aucun infirmier trouvé</h3>
            <p className="text-xs text-slate-500 mt-1">
              Modifiez votre recherche ou vos filtres pour afficher des résultats.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Agent (Nom, Prénom & Rôle)</th>
                  <th className="py-3 px-3">PPR / CNI</th>
                  <th className="py-3 px-3">Grade & Ancienneté</th>
                  <th className="py-3 px-3">Fonction Publique</th>
                  <th className="py-3 px-3">Situation Actuelle</th>
                  <th className="py-3 px-3">Congé Admin (22j + Rep.)</th>
                  <th className="py-3 px-3">Maladie (3 mois)</th>
                  <th className="py-3 px-3">Résidence & Navette</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNurses.map((nurse) => {
                  const anc = calculateAnciennete(nurse.dateRecrutement);
                  const soldeAdmin = getSoldeCongeAdmin(nurse);
                  const soldeMaladie = getSoldeCongeMaladie(nurse);

                  return (
                    <tr 
                      key={nurse.id}
                      className="hover:bg-slate-50/90 transition-colors group"
                    >
                      {/* Agent identification */}
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => onSelectNurse(nurse)}
                          className="font-bold text-slate-900 hover:text-teal-700 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{nurse.nom} {nurse.prenom}</span>
                        </div>
                        <div className="text-[11px] text-teal-800 font-medium">
                          {nurse.specialite}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {nurse.fonction}
                        </div>
                      </td>

                      {/* PPR & CNI */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono tabular-nums font-semibold text-slate-900">
                          {nurse.ppr}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          CNI: {nurse.cni}
                        </div>
                      </td>

                      {/* Grade & Ancienneté */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">
                          {nurse.grade}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Anc: <span className="font-semibold text-slate-700">{anc.texte}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Depuis {formatDateFr(nurse.dateRecrutement)}
                        </div>
                      </td>

                      {/* Statut Fonction Publique */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 font-medium">
                          {nurse.etatFonctionPublique}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {nurse.etatMarital} {nurse.nombreEnfants > 0 ? `· ${nurse.nombreEnfants} enf.` : ''}
                        </div>
                      </td>

                      {/* Situation Actuelle */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center text-xs font-semibold ${
                          nurse.situationActuelle === 'Système normal'
                            ? 'text-emerald-700'
                            : nurse.situationActuelle === 'Système de garde'
                              ? 'text-amber-700'
                              : nurse.situationActuelle === 'Congé administratif'
                                ? 'text-indigo-700'
                                : nurse.situationActuelle === 'Congé de maladie'
                                  ? 'text-rose-700'
                                  : 'text-slate-700'
                        }`}>
                          {nurse.situationActuelle}
                        </span>
                      </td>

                      {/* Congé Administratif */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono tabular-nums font-bold text-slate-900">
                            {soldeAdmin.restant}j <span className="font-normal text-slate-500">restants</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            /{soldeAdmin.totalAcquis}j
                          </span>
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${
                              soldeAdmin.restant <= 5 ? 'bg-amber-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${(soldeAdmin.restant / soldeAdmin.totalAcquis) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Droit: 22j + Rep: {soldeAdmin.reporte}j
                        </div>
                      </td>

                      {/* Congé Maladie */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono tabular-nums font-bold text-slate-900">
                            {soldeMaladie.restant}j <span className="font-normal text-slate-500">restants</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            /90j
                          </span>
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${
                              soldeMaladie.consomme >= 60 ? 'bg-rose-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${(soldeMaladie.restant / 90) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Consommé: {soldeMaladie.consomme}j
                        </div>
                      </td>

                      {/* Résidence & Navette */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">
                          {nurse.lieuResidence}
                        </div>
                        {nurse.navette ? (
                          <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-teal-600" />
                            Navetteur
                            {nurse.trajetNavette && (
                              <span className="text-slate-500 truncate max-w-[120px]" title={nurse.trajetNavette}>
                                ({nurse.trajetNavette})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">
                            Résident local
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectNurse(nurse)}
                            title="Consulter le dossier complet"
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeclareLeave(nurse)}
                            title="Poser une demande de congé"
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditNurse(nurse)}
                            title="Modifier les informations"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Confirmer la suppression de ${nurse.nom} ${nurse.prenom} (PPR: ${nurse.ppr}) ?`)) {
                                onDeleteNurse(nurse.id);
                              }
                            }}
                            title="Supprimer du fichier"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer scannable count */}
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Affichage de <span className="font-bold text-slate-900 tabular-nums">{filteredNurses.length}</span> sur <span className="font-bold text-slate-900 tabular-nums">{nurses.length}</span> infirmiers
          </div>
          <div className="font-mono text-slate-400">
            Service du Bloc Opératoire · Mise à jour 2026
          </div>
        </div>

      </div>

    </div>
  );
};
