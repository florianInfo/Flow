# Flow - Application React TypeScript avec Tailwind CSS

Projet React TypeScript moderne avec Tailwind CSS et une structure de répertoires organisée.

## 🚀 Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── ActivityCard.tsx
│   └── ActivityForm.tsx
├── models/             # Modèles de données TypeScript
│   └── Activity.ts     # Classe Activity complète avec toutes les fonctionnalités TypeScript
├── hooks/              # Hooks React personnalisés (à créer)
├── utils/              # Fonctions utilitaires (à créer)
├── services/           # Services API (à créer)
├── types/              # Types TypeScript globaux (à créer)
└── styles/             # Styles globaux
    └── index.css       # Styles Tailwind CSS
```

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## 📚 Classe Activity

La classe `Activity` dans `src/models/Activity.ts` est un exemple complet et exhaustif de toutes les fonctionnalités TypeScript, organisées du plus utilisé au moins utilisé.

Consultez `src/examples/activity-usage.example.ts` pour des exemples d'utilisation détaillés.

### Fonctionnalités incluses :

1. **Interfaces et Types** - Définitions de contrat
2. **Propriétés publiques** - Accès direct
3. **Propriétés privées** - Encapsulation
4. **Propriétés protégées** - Héritage
5. **Propriétés statiques** - Données partagées
6. **Propriétés readonly** - Immutabilité
7. **Constructeurs** - Initialisation
8. **Getters et Setters** - Accès contrôlé
9. **Méthodes publiques** - API principale
10. **Méthodes asynchrones** - Opérations async
11. **Méthodes génériques** - Flexibilité
12. **Méthodes statiques** - Opérations de classe
13. **Méthodes privées** - Implémentation interne
14. **Méthodes protégées** - Héritage
15. **Méthodes avec overload** - Polymorphisme
16. **Méthodes avec paramètres rest** - Flexibilité
17. **Méthodes avec paramètres par défaut** - Commodité
18. **Symboles et itérateurs** - Itérabilité
19. **Méthodes de lifecycle** - Cleanup
20. **Assertions de type** - Type safety
21. **Décorateurs** - Métaprogrammation
22. **Conditional types** - Types avancés
23. **Mapped types** - Transformation de types
24. **Utility types** - Types utilitaires
25. **Template literal types** - Types de chaînes

## 🎨 Technologies

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Vite** - Build tool moderne

## 📖 Exemples d'utilisation

### Création d'une activité

```typescript
import { Activity } from './models/Activity';

// Méthode recommandée
const activity = Activity.create(
  'Mon titre',
  'Ma description',
  {
    status: 'active',
    priority: 'high',
    category: 'Travail'
  }
);
```

### Utilisation des méthodes

```typescript
// Mise à jour
activity.updateStatus('completed');
activity.updatePriority('urgent');
activity.addTag('important');

// Statistiques
activity.incrementViews();
activity.like();
activity.share();

// Méthodes asynchrones
await activity.save();
const validation = await activity.validate();
```

### Méthodes statiques

```typescript
// Recherche
const activity = Activity.getById('act-001');
const activeActivities = Activity.findByStatus('active');

// Tri et groupement
const sorted = Activity.sortByPriority(activities);
const grouped = Activity.groupByStatus(activities);
```

## 📝 License

MIT

