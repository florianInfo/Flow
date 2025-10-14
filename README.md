# 🌿 Zen Weekly Planner

Une application de planification hebdomadaire avec une charte graphique zen inspirée de la nature et des tons bois/forêt.

## ✨ Fonctionnalités

### 🎯 Gestion des Activités
- **Création d'activités** avec titre personnalisé
- **Palette de couleurs** prédéfinie (5 catégories zen)
- **Couleurs personnalisées** avec sélecteur de couleur
- **Catégories thématiques** : Nature, Concentration, Énergie, Passion, Méditation

### 📅 Planning Interactif
- **Drag & Drop** fluide des activités
- **Redimensionnement** des créneaux (minimum 15 minutes)
- **Planning hebdomadaire** du lundi au dimanche
- **Créneaux horaires** de 6h à 22h
- **Interface intuitive** avec feedback visuel

### 📊 Statistiques Temps Réel
- **Classement F1** des activités par temps passé
- **Notifications animées** pour les changements
- **Statistiques détaillées** : temps total, sessions, classement
- **Mise à jour en temps réel** des données

### 🎨 Charte Graphique Zen
- **Palette de couleurs** bois/forêt :
  - 🌿 Vert sauge (#8BA888) - Nature / Calme
  - 🌲 Vert mousse (#7B8654) - Concentration
  - ☀️ Ocre doré (#DCA44C) - Énergie / Sport
  - 🔥 Terre cuivrée (#C1683C) - Passion / Créativité
  - 💧 Bleu sarcelle (#4B7B73) - Méditation / Détente

### 🖨️ Version Imprimable
- **Planning optimisé** pour l'impression
- **Statistiques de la semaine** incluses
- **Légende des couleurs** intégrée
- **Format A4** avec mise en page professionnelle

### 💾 Sauvegarde Locale
- **Sauvegarde automatique** dans localStorage
- **Système de sauvegarde** avec copies de sécurité
- **Chargement automatique** au démarrage
- **Export/Import** des données JSON

### 🎭 Animations Ludiques
- **Arrière-plan animé** avec particules flottantes
- **Transitions fluides** entre les états
- **Animations de drag & drop** expressives
- **Effets de respiration** pour l'ambiance zen
- **Notifications animées** avec auto-suppression

## 🚀 Installation

```bash
# Cloner le projet
git clone https://github.com/votre-username/zen-weekly-planner.git

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

## 🛠️ Technologies Utilisées

- **React 18** - Framework principal
- **Framer Motion** - Animations fluides
- **React Beautiful DnD** - Drag & Drop
- **React Color** - Sélecteur de couleurs
- **Date-fns** - Gestion des dates
- **CSS Variables** - Thème cohérent

## 📱 Responsive Design

L'application s'adapte parfaitement à tous les écrans :
- **Desktop** : Interface complète avec panneau latéral
- **Tablet** : Layout adaptatif avec navigation optimisée
- **Mobile** : Interface tactile avec contrôles simplifiés

## 🎨 Personnalisation

### Couleurs d'Activités
```css
/* Variables CSS personnalisables */
:root {
  --sage-green: #8BA888;
  --moss-green: #7B8654;
  --golden-ochre: #DCA44C;
  --terracotta: #C1683C;
  --teal: #4B7B73;
}
```

### Animations
- **Durée configurable** des transitions
- **Easing personnalisé** pour les animations
- **Support des préférences** de mouvement réduit

## 📊 Structure des Données

```json
{
  "activities": [
    {
      "id": "unique-id",
      "title": "Nom de l'activité",
      "color": "#8BA888",
      "category": "nature",
      "duration": 60,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "schedule": {
    "monday": {
      "6:00": { "id": "activity-id", "duration": 60 }
    }
  },
  "statistics": {
    "activity-id": {
      "totalMinutes": 120,
      "sessions": 2,
      "lastActivity": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 🎯 Utilisation

### Créer une Activité
1. Cliquez sur "Gestion des Activités"
2. Saisissez le titre de l'activité
3. Choisissez une catégorie ou une couleur personnalisée
4. Cliquez sur "Créer l'activité"

### Planifier une Semaine
1. Glissez-déposez les activités sur le planning
2. Redimensionnez les créneaux selon vos besoins
3. Consultez les statistiques en temps réel
4. Imprimez votre planning avec le bouton dédié

### Consulter les Statistiques
- **Classement F1** : Activités classées par temps passé
- **Notifications** : Changements de position et ajouts de temps
- **Résumé global** : Temps total, sessions, activités

## 🔧 Développement

### Structure du Projet
```
src/
├── components/          # Composants React
│   ├── WeeklyPlanner.js    # Planning principal
│   ├── ActivityManager.js  # Gestion des activités
│   ├── StatisticsPanel.js # Panneau statistiques
│   └── ...
├── utils/              # Utilitaires
│   └── storage.js         # Gestion localStorage
└── App.js             # Composant principal
```

### Scripts Disponibles
```bash
npm start      # Démarrage en développement
npm build      # Build de production
npm test       # Tests unitaires
npm eject      # Éjection de Create React App
```

## 🌟 Fonctionnalités Avancées

### Notifications Intelligentes
- **Détection automatique** des changements
- **Animations contextuelles** selon le type
- **Auto-suppression** avec barre de progression
- **Historique** des notifications

### Système de Sauvegarde
- **Sauvegarde automatique** à chaque modification
- **Copies de sécurité** quotidiennes
- **Nettoyage automatique** des anciennes sauvegardes
- **Récupération** en cas d'erreur

### Optimisations Performance
- **Lazy loading** des composants
- **Memoization** des calculs coûteux
- **Debouncing** des sauvegardes
- **Virtualization** pour les grandes listes

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche feature
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou suggestion :
- **Issues** : Utilisez le système d'issues GitHub
- **Discussions** : Rejoignez les discussions communautaires
- **Email** : contact@zen-planner.com

---

*Créé avec ❤️ et une approche zen pour une planification sereine de votre semaine.*
