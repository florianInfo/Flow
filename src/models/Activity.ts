/**
 * Classe Activity - Exemple complet et exhaustif de toutes les fonctionnalités TypeScript
 * 
 * Organisation : Du plus utilisé/important au moins utilisé/important
 */

// ============================================================================
// 1. INTERFACES ET TYPES (Très utilisés - Définitions de contrat)
// ============================================================================

/**
 * Interface pour les métadonnées d'une activité
 */
export interface IActivityMetadata {
  readonly createdAt: Date;
  updatedAt: Date;
  tags: string[];
  version: number;
}

/**
 * Interface pour les statistiques d'une activité
 */
export interface IActivityStats {
  views: number;
  likes: number;
  shares: number;
}

/**
 * Type union pour le statut d'une activité
 */
export type ActivityStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/**
 * Type pour les priorités
 */
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Type générique pour les callbacks
 */
export type ActivityCallback<T = void> = (activity: Activity) => T;

/**
 * Interface générique pour les filtres
 */
export interface IFilter<T> {
  field: keyof T;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

// ============================================================================
// 2. CLASSE PRINCIPALE - PROPRIÉTÉS PUBLIQUES (Très utilisées)
// ============================================================================

export class Activity {
  // Propriétés publiques simples (les plus utilisées)
  public id: string;
  private _title: string;
  public description: string;
  public status: ActivityStatus;
  public priority: ActivityPriority;

  // Propriétés publiques avec valeurs par défaut
  public isActive: boolean = true;
  public isVisible: boolean = true;
  public score: number = 0;

  // Propriétés publiques optionnelles (très utilisées)
  public category?: string;
  public location?: string;
  public dueDate?: Date;
  public assignedTo?: string;

  // ============================================================================
  // 3. PROPRIÉTÉS PRIVÉES (Utilisées pour l'encapsulation)
  // ============================================================================

  private _metadata: IActivityMetadata;
  private _stats: IActivityStats;
  private _internalNotes: string[] = [];
  private _history: Array<{ timestamp: Date; action: string; data: unknown }> = [];

  // Propriété privée avec valeur par défaut
  private _lastModifiedBy: string = 'system';

  // ============================================================================
  // 4. PROPRIÉTÉS PROTÉGÉES (Utilisées pour l'héritage)
  // ============================================================================

  protected _parentActivityId?: string;
  protected _childActivities: Activity[] = [];
  protected _accessLevel: 'public' | 'private' | 'restricted' = 'public';

  // ============================================================================
  // 5. PROPRIÉTÉS STATIQUES (Utilisées pour les données partagées)
  // ============================================================================

  public static readonly MAX_TITLE_LENGTH: number = 200;
  public static readonly MIN_TITLE_LENGTH: number = 3;
  public static readonly DEFAULT_PRIORITY: ActivityPriority = 'medium';
  
  private static _totalActivities: number = 0;
  private static _activityRegistry: Map<string, Activity> = new Map();

  // ============================================================================
  // 6. PROPRIÉTÉS EN LECTURE SEULE (readonly)
  // ============================================================================

  public readonly createdAt: Date;
  public readonly uniqueId: string;

  // ============================================================================
  // 7. CONSTRUCTEURS (Très utilisés - Initialisation)
  // ============================================================================

  /**
   * Constructeur principal avec paramètres obligatoires
   */
  constructor(
    id: string,
    title: string,
    description: string,
    status: ActivityStatus = 'draft',
    priority: ActivityPriority = Activity.DEFAULT_PRIORITY
  ) {
    // Validation des paramètres
    this.validateTitle(title);
    
    // Initialisation des propriétés publiques
    this.id = id;
    this._title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;

    // Initialisation des propriétés readonly
    this.createdAt = new Date();
    this.uniqueId = `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialisation des propriétés privées
    this._metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      version: 1,
    };

    this._stats = {
      views: 0,
      likes: 0,
      shares: 0,
    };

    // Incrémenter le compteur statique
    Activity._totalActivities++;
    
    // Enregistrer dans le registre statique
    Activity._activityRegistry.set(this.id, this);

    // Ajouter à l'historique
    this._addToHistory('created', { id, title });
  }

  /**
   * Constructeur statique - Factory method (très utilisé)
   */
  public static create(
    title: string,
    description: string,
    options?: {
      status?: ActivityStatus;
      priority?: ActivityPriority;
      category?: string;
    }
  ): Activity {
    const id = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const activity = new Activity(
      id,
      title,
      description,
      options?.status,
      options?.priority
    );
    
    if (options?.category) {
      activity.category = options.category;
    }

    return activity;
  }

  /**
   * Constructeur statique - Depuis JSON (très utilisé)
   */
  public static fromJSON(json: string | Record<string, unknown>): Activity {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const activity = new Activity(
      data.id as string,
      data.title as string,
      data.description as string,
      data.status as ActivityStatus,
      data.priority as ActivityPriority
    );

    // Restaurer les propriétés optionnelles
    if (data.category) activity.category = data.category as string;
    if (data.location) activity.location = data.location as string;
    if (data.dueDate) activity.dueDate = new Date(data.dueDate as string);
    if (data.assignedTo) activity.assignedTo = data.assignedTo as string;
    if (data.isActive !== undefined) activity.isActive = data.isActive as boolean;
    if (data.score !== undefined) activity.score = data.score as number;

    // Restaurer les métadonnées
    if (data._metadata) {
      activity._metadata = {
        ...data._metadata,
        createdAt: new Date(data._metadata.createdAt as string),
        updatedAt: new Date(data._metadata.updatedAt as string),
      } as IActivityMetadata;
    }

    // Restaurer les stats
    if (data._stats) {
      activity._stats = data._stats as IActivityStats;
    }

    return activity;
  }

  // ============================================================================
  // 8. GETTERS ET SETTERS (Très utilisés - Accès contrôlé)
  // ============================================================================

  /**
   * Getter pour les métadonnées (lecture seule)
   */
  public get metadata(): Readonly<IActivityMetadata> {
    return { ...this._metadata };
  }

  /**
   * Getter pour les statistiques
   */
  public get stats(): Readonly<IActivityStats> {
    return { ...this._stats };
  }

  /**
   * Getter pour les notes internes
   */
  public get internalNotes(): readonly string[] {
    return [...this._internalNotes];
  }

  /**
   * Getter pour l'historique
   */
  public get history(): ReadonlyArray<{ timestamp: Date; action: string; data: unknown }> {
    return [...this._history];
  }

  /**
   * Getter pour le dernier modificateur
   */
  public get lastModifiedBy(): string {
    return this._lastModifiedBy;
  }

  /**
   * Setter avec validation
   */
  public set title(newTitle: string) {
    this.validateTitle(newTitle);
    const oldTitle = this._title;
    this._title = newTitle;
    this._updateMetadata();
    this._addToHistory('title_changed', { oldTitle, newTitle });
  }

  /**
   * Getter pour le titre
   */
  public get title(): string {
    return this._title;
  }

  /**
   * Getter calculé
   */
  public get fullInfo(): string {
    return `${this._title} (${this.status}) - Priority: ${this.priority}`;
  }

  /**
   * Getter pour vérifier si l'activité est expirée
   */
  public get isExpired(): boolean {
    return this.dueDate ? this.dueDate < new Date() : false;
  }

  /**
   * Getter pour vérifier si l'activité peut être modifiée
   */
  public get canBeModified(): boolean {
    return this.status !== 'archived' && this.status !== 'completed';
  }

  // ============================================================================
  // 9. MÉTHODES PUBLIQUES (Très utilisées - API principale)
  // ============================================================================

  /**
   * Méthode publique pour mettre à jour le statut
   */
  public updateStatus(newStatus: ActivityStatus): boolean {
    if (!this.canBeModified) {
      throw new Error(`Cannot update status: Activity is ${this.status}`);
    }

    const oldStatus = this.status;
    this.status = newStatus;
    this._updateMetadata();
    this._addToHistory('status_changed', { oldStatus, newStatus });
    this._lastModifiedBy = 'user';

    return true;
  }

  /**
   * Méthode publique pour mettre à jour la priorité
   */
  public updatePriority(newPriority: ActivityPriority): void {
    const oldPriority = this.priority;
    this.priority = newPriority;
    this._updateMetadata();
    this._addToHistory('priority_changed', { oldPriority, newPriority });
    this._lastModifiedBy = 'user';
  }

  /**
   * Méthode publique pour ajouter un tag
   */
  public addTag(tag: string): void {
    if (!this._metadata.tags.includes(tag)) {
      this._metadata.tags.push(tag);
      this._updateMetadata();
      this._addToHistory('tag_added', { tag });
    }
  }

  /**
   * Méthode publique pour retirer un tag
   */
  public removeTag(tag: string): boolean {
    const index = this._metadata.tags.indexOf(tag);
    if (index > -1) {
      this._metadata.tags.splice(index, 1);
      this._updateMetadata();
      this._addToHistory('tag_removed', { tag });
      return true;
    }
    return false;
  }

  /**
   * Méthode publique pour ajouter une note interne
   */
  public addInternalNote(note: string): void {
    this._internalNotes.push(`${new Date().toISOString()}: ${note}`);
    this._addToHistory('note_added', { note });
  }

  /**
   * Méthode publique pour incrémenter les vues
   */
  public incrementViews(): void {
    this._stats.views++;
    this._addToHistory('viewed', { views: this._stats.views });
  }

  /**
   * Méthode publique pour liker
   */
  public like(): void {
    this._stats.likes++;
    this._addToHistory('liked', { likes: this._stats.likes });
  }

  /**
   * Méthode publique pour partager
   */
  public share(): void {
    this._stats.shares++;
    this._addToHistory('shared', { shares: this._stats.shares });
  }

  /**
   * Méthode publique pour mettre à jour le score
   */
  public updateScore(points: number): void {
    this.score += points;
    this._addToHistory('score_updated', { points, newScore: this.score });
  }

  /**
   * Méthode publique pour assigner à un utilisateur
   */
  public assignTo(userId: string): void {
    const previousAssignee = this.assignedTo;
    this.assignedTo = userId;
    this._updateMetadata();
    this._addToHistory('assigned', { previousAssignee, newAssignee: userId });
  }

  /**
   * Méthode publique pour définir une date d'échéance
   */
  public setDueDate(date: Date): void {
    if (date < new Date() && this.status !== 'completed') {
      throw new Error('Due date cannot be in the past for active activities');
    }
    this.dueDate = date;
    this._updateMetadata();
    this._addToHistory('due_date_set', { date });
  }

  /**
   * Méthode publique pour archiver
   */
  public archive(): void {
    if (this.status === 'archived') {
      return;
    }
    this.updateStatus('archived');
    this.isActive = false;
    this._addToHistory('archived', {});
  }

  /**
   * Méthode publique pour restaurer depuis l'archive
   */
  public restore(): void {
    if (this.status !== 'archived') {
      return;
    }
    this.status = 'draft';
    this.isActive = true;
    this._updateMetadata();
    this._addToHistory('restored', {});
  }

  /**
   * Méthode publique pour cloner l'activité
   */
  public clone(): Activity {
    const cloned = Activity.create(this.title, this.description, {
      status: 'draft',
      priority: this.priority,
      category: this.category,
    });

    // Copier les propriétés optionnelles
    if (this.location) cloned.location = this.location;
    if (this.assignedTo) cloned.assignedTo = this.assignedTo;
    if (this.dueDate) cloned.dueDate = new Date(this.dueDate);

    // Copier les tags
    this._metadata.tags.forEach(tag => cloned.addTag(tag));

    cloned._addToHistory('cloned_from', { originalId: this.id });

    return cloned;
  }

  /**
   * Méthode publique pour convertir en JSON
   */
  public toJSON(): string {
    return JSON.stringify({
      id: this.id,
      title: this._title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      category: this.category,
      location: this.location,
      dueDate: this.dueDate?.toISOString(),
      assignedTo: this.assignedTo,
      isActive: this.isActive,
      isVisible: this.isVisible,
      score: this.score,
      _metadata: {
        ...this._metadata,
        createdAt: this._metadata.createdAt.toISOString(),
        updatedAt: this._metadata.updatedAt.toISOString(),
      },
      _stats: this._stats,
      createdAt: this.createdAt.toISOString(),
      uniqueId: this.uniqueId,
    });
  }

  /**
   * Méthode publique pour obtenir un résumé
   */
  public getSummary(): Record<string, unknown> {
    return {
      id: this.id,
      title: this._title,
      status: this.status,
      priority: this.priority,
      isActive: this.isActive,
      score: this.score,
      views: this._stats.views,
      likes: this._stats.likes,
      tags: this._metadata.tags,
    };
  }

  /**
   * Méthode publique avec callback
   */
  public executeWithCallback<T>(callback: ActivityCallback<T>): T {
    return callback(this);
  }

  // ============================================================================
  // 10. MÉTHODES ASYNCHRONES (Utilisées pour les opérations async)
  // ============================================================================

  /**
   * Méthode asynchrone pour sauvegarder
   */
  public async save(): Promise<boolean> {
    // Simulation d'une opération asynchrone
    return new Promise((resolve) => {
      setTimeout(() => {
        this._updateMetadata();
        this._addToHistory('saved', {});
        resolve(true);
      }, 100);
    });
  }

  /**
   * Méthode asynchrone pour charger depuis une source externe
   */
  public static async loadFromSource(source: string): Promise<Activity> {
    // Simulation d'un chargement asynchrone
    return new Promise((resolve) => {
      setTimeout(() => {
        const activity = Activity.create('Loaded Activity', 'Loaded from source', {
          status: 'active',
        });
        activity.addInternalNote(`Loaded from: ${source}`);
        resolve(activity);
      }, 200);
    });
  }

  /**
   * Méthode asynchrone pour valider l'activité
   */
  public async validate(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validation asynchrone
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!this._title || this._title.length < Activity.MIN_TITLE_LENGTH) {
      errors.push(`Title must be at least ${Activity.MIN_TITLE_LENGTH} characters`);
    }

    if (this._title.length > Activity.MAX_TITLE_LENGTH) {
      errors.push(`Title must be less than ${Activity.MAX_TITLE_LENGTH} characters`);
    }

    if (!this.description) {
      errors.push('Description is required');
    }

    if (this.isExpired && this.status !== 'completed') {
      errors.push('Activity is expired but not completed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // 11. MÉTHODES GÉNÉRIQUES (Utilisées pour la flexibilité)
  // ============================================================================

  /**
   * Méthode générique pour filtrer
   */
  public static filter<T extends Activity>(
    activities: T[],
    filter: IFilter<T>
  ): T[] {
    return activities.filter(activity => {
      const value = activity[filter.field];
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).includes(String(filter.value));
        case 'greaterThan':
          return Number(value) > Number(filter.value);
        case 'lessThan':
          return Number(value) < Number(filter.value);
        default:
          return false;
      }
    });
  }

  /**
   * Méthode générique pour mapper
   */
  public static map<T extends Activity, R>(
    activities: T[],
    mapper: (activity: T) => R
  ): R[] {
    return activities.map(mapper);
  }

  /**
   * Méthode générique pour réduire
   */
  public static reduce<T extends Activity, R>(
    activities: T[],
    reducer: (acc: R, activity: T) => R,
    initialValue: R
  ): R {
    return activities.reduce(reducer, initialValue);
  }

  // ============================================================================
  // 12. MÉTHODES STATIQUES (Utilisées pour les opérations de classe)
  // ============================================================================

  /**
   * Méthode statique pour obtenir le total d'activités
   */
  public static getTotalCount(): number {
    return Activity._totalActivities;
  }

  /**
   * Méthode statique pour obtenir une activité par ID
   */
  public static getById(id: string): Activity | undefined {
    return Activity._activityRegistry.get(id);
  }

  /**
   * Méthode statique pour obtenir toutes les activités
   */
  public static getAll(): Activity[] {
    return Array.from(Activity._activityRegistry.values());
  }

  /**
   * Méthode statique pour supprimer une activité du registre
   */
  public static removeFromRegistry(id: string): boolean {
    return Activity._activityRegistry.delete(id);
  }

  /**
   * Méthode statique pour vider le registre
   */
  public static clearRegistry(): void {
    Activity._activityRegistry.clear();
    Activity._totalActivities = 0;
  }

  /**
   * Méthode statique pour trouver par critères
   */
  public static findByStatus(status: ActivityStatus): Activity[] {
    return Activity.getAll().filter(activity => activity.status === status);
  }

  /**
   * Méthode statique pour trouver par priorité
   */
  public static findByPriority(priority: ActivityPriority): Activity[] {
    return Activity.getAll().filter(activity => activity.priority === priority);
  }

  /**
   * Méthode statique pour trier
   */
  public static sortByPriority(activities: Activity[]): Activity[] {
    const priorityOrder: Record<ActivityPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...activities].sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Méthode statique pour grouper
   */
  public static groupByStatus(activities: Activity[]): Record<ActivityStatus, Activity[]> {
    const grouped: Partial<Record<ActivityStatus, Activity[]>> = {};

    activities.forEach(activity => {
      if (!grouped[activity.status]) {
        grouped[activity.status] = [];
      }
      grouped[activity.status]!.push(activity);
    });

    return grouped as Record<ActivityStatus, Activity[]>;
  }

  // ============================================================================
  // 13. MÉTHODES PRIVÉES (Utilisées pour l'implémentation interne)
  // ============================================================================

  /**
   * Méthode privée pour valider le titre
   */
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (title.length < Activity.MIN_TITLE_LENGTH) {
      throw new Error(`Title must be at least ${Activity.MIN_TITLE_LENGTH} characters`);
    }
    if (title.length > Activity.MAX_TITLE_LENGTH) {
      throw new Error(`Title must be less than ${Activity.MAX_TITLE_LENGTH} characters`);
    }
  }

  /**
   * Méthode privée pour mettre à jour les métadonnées
   */
  private _updateMetadata(): void {
    this._metadata.updatedAt = new Date();
    this._metadata.version++;
    this._lastModifiedBy = 'user'; // En production, utiliser l'utilisateur réel
  }

  /**
   * Méthode privée pour ajouter à l'historique
   */
  private _addToHistory(action: string, data: unknown): void {
    this._history.push({
      timestamp: new Date(),
      action,
      data,
    });

    // Limiter l'historique à 100 entrées
    if (this._history.length > 100) {
      this._history.shift();
    }
  }

  // ============================================================================
  // 14. MÉTHODES PROTÉGÉES (Utilisées pour l'héritage)
  // ============================================================================

  /**
   * Méthode protégée pour définir le parent
   */
  protected setParent(parentId: string): void {
    this._parentActivityId = parentId;
    this._addToHistory('parent_set', { parentId });
  }

  /**
   * Méthode protégée pour ajouter un enfant
   */
  protected addChild(child: Activity): void {
    if (!this._childActivities.find(a => a.id === child.id)) {
      this._childActivities.push(child);
      child.setParent(this.id);
      this._addToHistory('child_added', { childId: child.id });
    }
  }

  /**
   * Méthode protégée pour définir le niveau d'accès
   */
  protected setAccessLevel(level: 'public' | 'private' | 'restricted'): void {
    this._accessLevel = level;
    this._addToHistory('access_level_changed', { level });
  }

  // ============================================================================
  // 15. MÉTHODES AVEC OVERLOAD (Moins utilisées mais puissantes)
  // ============================================================================

  /**
   * Overload 1: Mettre à jour avec un objet
   */
  public update(data: {
    title?: string;
    description?: string;
    status?: ActivityStatus;
    priority?: ActivityPriority;
    category?: string;
  }): void;

  /**
   * Overload 2: Mettre à jour avec des paramètres individuels
   */
  public update(
    title?: string,
    description?: string,
    status?: ActivityStatus,
    priority?: ActivityPriority
  ): void;

  /**
   * Implémentation de la méthode update
   */
  public update(
    dataOrTitle?: string | {
      title?: string;
      description?: string;
      status?: ActivityStatus;
      priority?: ActivityPriority;
      category?: string;
    },
    description?: string,
    status?: ActivityStatus,
    priority?: ActivityPriority
  ): void {
    if (typeof dataOrTitle === 'object' && dataOrTitle !== null) {
      // Overload 1: Objet
      if (dataOrTitle.title) this._title = dataOrTitle.title;
      if (dataOrTitle.description) this.description = dataOrTitle.description;
      if (dataOrTitle.status) this.updateStatus(dataOrTitle.status);
      if (dataOrTitle.priority) this.updatePriority(dataOrTitle.priority);
      if (dataOrTitle.category) this.category = dataOrTitle.category;
    } else {
      // Overload 2: Paramètres individuels
      if (dataOrTitle) this._title = dataOrTitle;
      if (description) this.description = description;
      if (status) this.updateStatus(status);
      if (priority) this.updatePriority(priority);
    }

    this._updateMetadata();
    this._addToHistory('updated', {});
  }

  // ============================================================================
  // 16. MÉTHODES AVEC PARAMÈTRES REST (Moins utilisées)
  // ============================================================================

  /**
   * Méthode avec paramètres rest pour ajouter plusieurs tags
   */
  public addTags(...tags: string[]): void {
    tags.forEach(tag => this.addTag(tag));
  }

  /**
   * Méthode avec paramètres rest pour ajouter plusieurs notes
   */
  public addInternalNotes(...notes: string[]): void {
    notes.forEach(note => this.addInternalNote(note));
  }

  // ============================================================================
  // 17. MÉTHODES AVEC PARAMÈTRES PAR DÉFAUT (Moins utilisées)
  // ============================================================================

  /**
   * Méthode avec paramètres par défaut
   */
  public schedule(
    days: number = 7,
    notify: boolean = true,
    reminder: boolean = true
  ): void {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + days);
    this.setDueDate(scheduledDate);

    if (notify) {
      this.addInternalNote(`Scheduled for ${scheduledDate.toLocaleDateString()}`);
    }

    if (reminder) {
      this.addTag('reminder');
    }
  }

  // ============================================================================
  // 18. SYMBOLES ET ITÉRATEURS (Rarement utilisés mais avancés)
  // ============================================================================

  /**
   * Méthode pour rendre la classe itérable
   */
  public *[Symbol.iterator](): Generator<[string, unknown]> {
    yield ['id', this.id];
    yield ['title', this._title];
    yield ['status', this.status];
    yield ['priority', this.priority];
    yield ['score', this.score];
  }

  // ============================================================================
  // 19. MÉTHODES DE LIFECYCLE (Rarement utilisées)
  // ============================================================================

  /**
   * Méthode appelée avant la destruction (cleanup)
   */
  public dispose(): void {
    Activity.removeFromRegistry(this.id);
    this._history = [];
    this._internalNotes = [];
    this._metadata.tags = [];
  }

  // ============================================================================
  // 20. MÉTHODES AVEC ASSERTIONS DE TYPE (Rarement utilisées)
  // ============================================================================

  /**
   * Méthode avec assertion de type
   */
  public assertIsActive(): asserts this is Activity & { status: 'active' } {
    if (this.status !== 'active') {
      throw new Error('Activity is not active');
    }
  }

  /**
   * Type guard
   */
  public isCompleted(): this is Activity & { status: 'completed' } {
    return this.status === 'completed';
  }

  // ============================================================================
  // 21. MÉTHODES AVEC DÉCORATEURS (Très rarement utilisées - nécessite configuration)
  // ============================================================================

  /**
   * Note: Les décorateurs nécessitent "experimentalDecorators": true dans tsconfig.json
   * Cette méthode est commentée car elle nécessite une configuration spéciale
   */
  
  // @deprecated("Use updateStatus instead")
  // public changeStatus(newStatus: ActivityStatus): void {
  //   this.updateStatus(newStatus);
  // }

  // ============================================================================
  // 22. MÉTHODES AVEC CONDITIONAL TYPES (Très rarement utilisées)
  // ============================================================================

  /**
   * Type conditionnel pour les valeurs de retour
   */
  public getValue<T extends 'id' | 'title' | 'status' | 'priority'>(
    key: T
  ): T extends 'id' ? string :
      T extends 'title' ? string :
      T extends 'status' ? ActivityStatus :
      T extends 'priority' ? ActivityPriority :
      never {
    return this[key] as never;
  }

  // ============================================================================
  // 23. MÉTHODES AVEC MAPPED TYPES (Très rarement utilisées)
  // ============================================================================

  /**
   * Méthode qui retourne un objet avec toutes les propriétés en readonly
   */
  public getReadonlySnapshot(): Readonly<{
    id: string;
    title: string;
    description: string;
    status: ActivityStatus;
    priority: ActivityPriority;
  }> {
    return {
      id: this.id,
      title: this._title,
      description: this.description,
      status: this.status,
      priority: this.priority,
    };
  }

  // ============================================================================
  // 24. MÉTHODES AVEC UTILITY TYPES (Très rarement utilisées)
  // ============================================================================

  /**
   * Méthode qui retourne un Partial de l'activité
   */
  public getPartialUpdate(): Partial<Pick<Activity, 'title' | 'description' | 'status' | 'priority'>> {
    return {
      title: this._title,
      description: this.description,
      status: this.status,
      priority: this.priority,
    };
  }

  /**
   * Méthode qui retourne un Required de certaines propriétés
   */
  public getRequiredFields(): Required<Pick<Activity, 'id' | 'title' | 'description'>> {
    return {
      id: this.id,
      title: this._title,
      description: this.description,
    };
  }

  // ============================================================================
  // 25. MÉTHODES AVEC TEMPLATE LITERAL TYPES (Très rarement utilisées)
  // ============================================================================

  /**
   * Type de template literal pour les IDs
   */
  public static generateId(prefix: 'activity' | 'task' | 'event' = 'activity'): `${string}-${string}` {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}` as `${string}-${string}`;
  }
}

// ============================================================================
// 26. EXPORT DE TYPES ET INTERFACES (Pour utilisation externe)
// ============================================================================
// Note: Les types et interfaces sont déjà exportés dans leurs déclarations
// ci-dessus, donc pas besoin de les réexporter ici

