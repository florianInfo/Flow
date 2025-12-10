/**
 * Exemples d'utilisation de la classe Activity
 * Ce fichier montre comment utiliser toutes les fonctionnalités de la classe Activity
 */

import { Activity } from '../models/Activity';

// ============================================================================
// 1. CRÉATION D'ACTIVITÉS (Très utilisé)
// ============================================================================

// Création avec le constructeur
const activity1 = new Activity(
  'act-001',
  'Ma première activité',
  'Description de l\'activité',
  'active',
  'high'
);

// Création avec la méthode statique create (recommandé)
const activity2 = Activity.create(
  'Ma deuxième activité',
  'Description',
  {
    status: 'draft',
    priority: 'medium',
    category: 'Travail'
  }
);

// Création depuis JSON
const jsonData = {
  id: 'act-003',
  title: 'Activité depuis JSON',
  description: 'Description',
  status: 'active' as const,
  priority: 'low' as const
};
const activity3 = Activity.fromJSON(JSON.stringify(jsonData));

// ============================================================================
// 2. ACCÈS AUX PROPRIÉTÉS (Très utilisé)
// ============================================================================

console.log(activity1.id); // 'act-001'
console.log(activity1.title); // 'Ma première activité'
console.log(activity1.status); // 'active'
console.log(activity1.priority); // 'high'
console.log(activity1.isActive); // true
console.log(activity1.score); // 0

// Propriétés optionnelles
activity1.category = 'Personnel';
activity1.location = 'Paris';
activity1.assignedTo = 'user-123';

// Propriétés readonly
console.log(activity1.createdAt); // Date
console.log(activity1.uniqueId); // string unique

// ============================================================================
// 3. GETTERS (Très utilisé)
// ============================================================================

const metadata = activity1.metadata; // Readonly<IActivityMetadata>
const stats = activity1.stats; // Readonly<IActivityStats>
const notes = activity1.internalNotes; // readonly string[]
const history = activity1.history; // ReadonlyArray
const fullInfo = activity1.fullInfo; // string calculé
const isExpired = activity1.isExpired; // boolean
const canModify = activity1.canBeModified; // boolean

// ============================================================================
// 4. SETTERS (Très utilisé)
// ============================================================================

activity1.title = 'Nouveau titre'; // Valide et met à jour automatiquement

// ============================================================================
// 5. MÉTHODES PUBLIQUES (Très utilisé)
// ============================================================================

// Mise à jour du statut
activity1.updateStatus('completed');

// Mise à jour de la priorité
activity1.updatePriority('urgent');

// Gestion des tags
activity1.addTag('important');
activity1.addTag('urgent');
activity1.removeTag('important');

// Ajout de notes internes
activity1.addInternalNote('Note importante');

// Statistiques
activity1.incrementViews();
activity1.like();
activity1.share();

// Score
activity1.updateScore(10);
activity1.updateScore(-5);

// Assignation
activity1.assignTo('user-456');

// Date d'échéance
activity1.setDueDate(new Date('2024-12-31'));

// Archive/Restauration
activity1.archive();
activity1.restore();

// Clonage
const cloned = activity1.clone();

// Conversion JSON
const json = activity1.toJSON();
const summary = activity1.getSummary();

// Callback
activity1.executeWithCallback((act) => {
  console.log(`Processing activity: ${act.title}`);
  return act.id;
});

// Mise à jour avec overload
activity1.update({
  title: 'Titre mis à jour',
  description: 'Nouvelle description',
  status: 'active',
  priority: 'high',
  category: 'Nouvelle catégorie'
});

// Ou avec paramètres individuels
activity1.update('Autre titre', 'Autre description', 'paused', 'medium');

// ============================================================================
// 6. MÉTHODES ASYNCHRONES (Utilisé)
// ============================================================================

// Sauvegarde
await activity1.save();

// Chargement depuis source
const loaded = await Activity.loadFromSource('database');

// Validation
const validation = await activity1.validate();
if (!validation.isValid) {
  console.error('Erreurs:', validation.errors);
}

// ============================================================================
// 7. MÉTHODES STATIQUES (Utilisé)
// ============================================================================

// Compteur total
const total = Activity.getTotalCount();

// Recherche par ID
const found = Activity.getById('act-001');

// Toutes les activités
const all = Activity.getAll();

// Recherche par statut
const activeActivities = Activity.findByStatus('active');

// Recherche par priorité
const highPriority = Activity.findByPriority('high');

// Tri par priorité
const sorted = Activity.sortByPriority(all);

// Groupement par statut
const grouped = Activity.groupByStatus(all);

// Génération d'ID
const newId = Activity.generateId('activity');

// ============================================================================
// 8. MÉTHODES GÉNÉRIQUES (Moins utilisé mais puissant)
// ============================================================================

const activities = [activity1, activity2, activity3];

// Filtrage
const filtered = Activity.filter(activities, {
  field: 'status',
  operator: 'equals',
  value: 'active'
});

// Mapping
const titles = Activity.map(activities, (act) => act.title);

// Réduction
const totalScore = Activity.reduce(
  activities,
  (sum, act) => sum + act.score,
  0
);

// ============================================================================
// 9. MÉTHODES AVEC PARAMÈTRES REST (Moins utilisé)
// ============================================================================

activity1.addTags('tag1', 'tag2', 'tag3');
activity1.addInternalNotes('Note 1', 'Note 2', 'Note 3');

// ============================================================================
// 10. MÉTHODES AVEC PARAMÈTRES PAR DÉFAUT (Moins utilisé)
// ============================================================================

activity1.schedule(7, true, true); // 7 jours, avec notification et rappel
activity1.schedule(14); // 14 jours, avec valeurs par défaut

// ============================================================================
// 11. ITÉRATION (Rarement utilisé)
// ============================================================================

for (const [key, value] of activity1) {
  console.log(`${key}: ${value}`);
}

// ============================================================================
// 12. TYPE GUARDS ET ASSERTIONS (Rarement utilisé)
// ============================================================================

if (activity1.isCompleted()) {
  // TypeScript sait que status est 'completed' ici
  console.log('Activité terminée');
}

// Assertion
try {
  activity1.assertIsActive();
  // TypeScript sait que status est 'active' ici
} catch (error) {
  console.error('Activité non active');
}

// ============================================================================
// 13. UTILITY TYPES (Très rarement utilisé)
// ============================================================================

const snapshot = activity1.getReadonlySnapshot();
const partial = activity1.getPartialUpdate();
const required = activity1.getRequiredFields();

// ============================================================================
// 14. CONDITIONAL TYPES (Très rarement utilisé)
// ============================================================================

const id = activity1.getValue('id'); // string
const title = activity1.getValue('title'); // string
const status = activity1.getValue('status'); // ActivityStatus
const priority = activity1.getValue('priority'); // ActivityPriority

// ============================================================================
// 15. CLEANUP (Rarement utilisé)
// ============================================================================

activity1.dispose(); // Nettoie les ressources

// ============================================================================
// 16. CONSTANTES STATIQUES (Utilisé)
// ============================================================================

console.log(Activity.MAX_TITLE_LENGTH); // 200
console.log(Activity.MIN_TITLE_LENGTH); // 3
console.log(Activity.DEFAULT_PRIORITY); // 'medium'

