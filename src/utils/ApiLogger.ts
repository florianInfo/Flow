/**
 * Interface pour les paramètres de log d'API
 */
export interface ApiLogParams {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  pathParams?: Record<string, any>
  body?: any
  queryParams?: Record<string, any>
}

/**
 * Fonction utilitaire pour logger les requêtes API de manière standardisée
 * 
 * @param params - Paramètres de la requête API
 * 
 * @example
 * logApiRequest({
 *   method: 'PATCH',
 *   path: '/api/users/:userId/templates/:templateId',
 *   pathParams: { userId: 1, templateId: 2 },
 *   body: { scheduledActivities: [...] },
 *   queryParams: { include: 'activities' }
 * })
 */
export function logApiRequest(params: ApiLogParams): void {
  const { method, path, pathParams, body, queryParams } = params

  // Remplacer les paramètres dans le path
  let finalPath = path
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      finalPath = finalPath.replace(`:${key}`, String(value))
    })
  }

  // Construire l'URL complète avec query params
  let fullUrl = finalPath
  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(queryParams).reduce((acc, [key, value]) => {
        acc[key] = String(value)
        return acc
      }, {} as Record<string, string>)
    ).toString()
    fullUrl = `${finalPath}?${queryString}`
  }

  // Construire le log structuré
  const logData: any = {
    method,
    path: finalPath,
    fullUrl,
  }

  if (pathParams && Object.keys(pathParams).length > 0) {
    logData.pathParams = pathParams
  }

  if (queryParams && Object.keys(queryParams).length > 0) {
    logData.queryParams = queryParams
  }

  if (body) {
    logData.body = body
  }

  // Afficher le log
  console.log('=== API REQUEST ===')
  console.log(`Method: ${method}`)
  console.log(`Path: ${finalPath}`)
  if (pathParams && Object.keys(pathParams).length > 0) {
    console.log('Path Params:', pathParams)
  }
  if (queryParams && Object.keys(queryParams).length > 0) {
    console.log('Query Params:', queryParams)
  }
  if (body) {
    console.log('Body:', JSON.stringify(body, null, 2))
  }
  console.log('Full URL:', fullUrl)
  console.log('==================')
  console.log('Complete Request:', JSON.stringify(logData, null, 2))
  console.log('==================')
}
