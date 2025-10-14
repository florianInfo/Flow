import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChromePicker } from 'react-color';
import './ActivityManager.css';

const ActivityManager = ({ activities, onActivitiesChange, onNotification }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({
    title: '',
    color: '#8BA888',
    category: 'nature'
  });

  // Catégories prédéfinies avec leurs couleurs
  const categories = [
    { id: 'nature', name: 'Nature / Calme', color: '#8BA888', icon: '🌿' },
    { id: 'work', name: 'Concentration', color: '#7B8654', icon: '🌲' },
    { id: 'energy', name: 'Énergie / Sport', color: '#DCA44C', icon: '☀️' },
    { id: 'passion', name: 'Passion / Créativité', color: '#C1683C', icon: '🔥' },
    { id: 'meditation', name: 'Méditation / Détente', color: '#4B7B73', icon: '💧' }
  ];

  // Créer une nouvelle activité
  const handleCreateActivity = () => {
    if (!newActivity.title.trim()) {
      onNotification('Veuillez saisir un titre pour l\'activité', 'warning');
      return;
    }

    const activity = {
      id: Date.now().toString(),
      title: newActivity.title.trim(),
      color: newActivity.color,
      category: newActivity.category,
      duration: 60, // Durée par défaut : 1 heure
      createdAt: new Date().toISOString()
    };

    onActivitiesChange([...activities, activity]);
    setNewActivity({ title: '', color: '#8BA888', category: 'nature' });
    onNotification(`Activité "${activity.title}" créée`, 'success');
  };

  // Supprimer une activité
  const handleDeleteActivity = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    onActivitiesChange(activities.filter(a => a.id !== activityId));
    onNotification(`Activité "${activity.title}" supprimée`, 'info');
  };

  // Modifier une activité
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      color: activity.color,
      category: activity.category
    });
  };

  // Sauvegarder les modifications
  const handleSaveEdit = () => {
    if (!newActivity.title.trim()) {
      onNotification('Veuillez saisir un titre pour l\'activité', 'warning');
      return;
    }

    const updatedActivities = activities.map(activity => 
      activity.id === editingActivity.id 
        ? { ...activity, ...newActivity, title: newActivity.title.trim() }
        : activity
    );

    onActivitiesChange(updatedActivities);
    setEditingActivity(null);
    setNewActivity({ title: '', color: '#8BA888', category: 'nature' });
    onNotification(`Activité "${newActivity.title}" modifiée`, 'success');
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingActivity(null);
    setNewActivity({ title: '', color: '#8BA888', category: 'nature' });
  };

  // Changer la catégorie
  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setNewActivity(prev => ({
      ...prev,
      category: categoryId,
      color: category.color
    }));
  };

  return (
    <div className="activity-manager">
      <div className="manager-header">
        <h3>Gestion des Activités</h3>
        <div className="activity-count">
          {activities.length} activité{activities.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Formulaire de création/édition */}
      <div className="activity-form">
        <div className="form-group">
          <label htmlFor="activity-title">Titre de l'activité</label>
          <input
            id="activity-title"
            type="text"
            value={newActivity.title}
            onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ex: Sport, Journaling, Méditation..."
            className="activity-input"
          />
        </div>

        <div className="form-group">
          <label>Catégorie</label>
          <div className="category-selector">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${newActivity.category === category.id ? 'selected' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
                style={{ borderColor: category.color }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Couleur personnalisée</label>
          <div className="color-picker-container">
            <button
              className="color-picker-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{ backgroundColor: newActivity.color }}
            >
              Choisir une couleur
            </button>
            {showColorPicker && (
              <div className="color-picker-popup">
                <ChromePicker
                  color={newActivity.color}
                  onChange={(color) => setNewActivity(prev => ({ ...prev, color: color.hex }))}
                  disableAlpha
                />
                <button 
                  className="close-picker"
                  onClick={() => setShowColorPicker(false)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          {editingActivity ? (
            <>
              <button 
                className="save-btn"
                onClick={handleSaveEdit}
              >
                💾 Sauvegarder
              </button>
              <button 
                className="cancel-btn"
                onClick={handleCancelEdit}
              >
                ❌ Annuler
              </button>
            </>
          ) : (
            <button 
              className="create-btn"
              onClick={handleCreateActivity}
            >
              ➕ Créer l'activité
            </button>
          )}
        </div>
      </div>

      {/* Liste des activités */}
      <div className="activities-list">
        <h4>Mes Activités</h4>
        <AnimatePresence>
          {activities.map(activity => (
            <motion.div
              key={activity.id}
              className="activity-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="activity-preview"
                style={{ backgroundColor: activity.color }}
              >
                <span className="activity-preview-title">{activity.title}</span>
              </div>
              
              <div className="activity-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditActivity(activity)}
                  title="Modifier l'activité"
                >
                  ✏️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteActivity(activity.id)}
                  title="Supprimer l'activité"
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>Aucune activité créée</p>
            <small>Créez votre première activité pour commencer à planifier votre semaine</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityManager;
