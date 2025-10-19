# Flow Planner 🌿

Une application de planning immersive et ludique avec drag & drop, conçue pour planifier votre semaine de manière zen et efficace.

## ✨ Fonctionnalités

### 🎯 Planning Immersif
- **Interface immersive** : Prend tout l'écran pour une expérience de jeu
- **Design zen** : Charte graphique bois/forêt avec palette de couleurs naturelles
- **Animations fluides** : Transitions et animations ludiques avec Framer Motion

### 🎨 Création d'Activités
- **Création intuitive** : Bouton "Nouvelle activité" avec popup de création
- **Palette de couleurs** : 5 couleurs thématiques (Sauge, Mousse, Or, Cuivre, Sarcelle)
- **Catégorisation** : Général, Travail, Sport, Loisirs, Personnel
- **Templates** : Activités disponibles en haut pour drag & drop

### 🖱️ Drag & Drop Avancé
- **Glisser-déposer** : Déplacez les activités depuis les templates vers les créneaux
- **Détection de conflits** : Empêche la superposition d'activités
- **Feedback visuel** : Animations et notifications en temps réel

### ⏰ Gestion du Temps
- **Redimensionnement** : Ajustez la durée des activités (15min min, 24h max)
- **Créneaux flexibles** : Système de créneaux de 15 minutes
- **Indicateurs visuels** : Affichage de la durée au survol

### 📊 Statistiques en Temps Réel
- **Classement F1** : Top 5 des activités par temps passé
- **Mise à jour live** : Changements de position avec animations
- **Métriques détaillées** : Temps total, moyenne, nombre de sessions
- **Notifications** : Alertes "+30min" lors des changements

### 💾 Sauvegarde Locale
- **Persistance** : Données sauvegardées automatiquement dans le navigateur
- **Format JSON** : Structure de données claire et extensible
- **Chargement automatique** : Restauration des données au démarrage

### 🖨️ Impression
- **Version imprimable** : Optimisée pour l'impression
- **Mise en page adaptée** : Styles spéciaux pour l'impression
- **Bouton d'impression** : Accès direct depuis l'interface

## 🚀 Installation

```bash
# Cloner le projet
git clone <repository-url>
cd flow-planner

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

## 🎨 Palette de Couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| 🌿 Sauge | `#8BA888` | Nature / Calme / Repos |
| 🌲 Mousse | `#7B8654` | Concentration / Travail |
| ☀️ Or | `#DCA44C` | Énergie / Sport / Motivation |
| 🔥 Cuivre | `#C1683C` | Passion / Créativité |
| 💧 Sarcelle | `#4B7B73` | Méditation / Détente / Soirée |

## 🏗️ Architecture

### Modèles de Données
- **Planner** : Conteneur principal avec activités, créneaux et programmations
- **Activity** : Modèle d'activité avec titre, couleur et catégorie
- **Creneaux** : Créneau horaire avec jour, heure de début et fin
- **ScheduledActivity** : Liaison entre activité et créneau

### Composants Principaux
- **Header** : Logo, titre et actions (impression, paramètres)
- **ActivityCreator** : Création et gestion des activités
- **PlannerGrid** : Grille principale avec drag & drop
- **StatisticsPanel** : Classement et statistiques en temps réel
- **NotificationSystem** : Système de notifications

### Technologies
- **React 18** : Framework principal
- **Tailwind CSS** : Styling et design system
- **Framer Motion** : Animations et transitions
- **@dnd-kit** : Système de drag & drop
- **Lucide React** : Icônes modernes

## 📱 Utilisation

1. **Créer une activité** : Cliquez sur "Nouvelle activité" et remplissez le formulaire
2. **Programmer** : Glissez l'activité depuis le haut vers un créneau horaire
3. **Ajuster la durée** : Survolez l'activité et redimensionnez avec les poignées
4. **Suivre les stats** : Consultez le classement en bas de page
5. **Imprimer** : Utilisez le bouton d'impression pour sauvegarder votre planning

## 🎮 Expérience Utilisateur

L'application est conçue comme un jeu avec :
- **Animations fluides** : Transitions douces et naturelles
- **Feedback visuel** : Réactions immédiates aux actions
- **Interface immersive** : Plein écran pour une concentration maximale
- **Design zen** : Couleurs apaisantes et typographie claire

## 🔧 Développement

```bash
# Mode développement
npm start

# Build de production
npm run build

# Tests
npm test
```

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

---

*Flow Planner* - Planifiez votre semaine en toute sérénité 🌿
