import { z } from 'zod'

/**
 * Schémas de validation avec Zod
 * Validation robuste pour tous les formulaires
 */

// Schéma email
export const emailSchema = z.string().email('Email invalide')

// Schéma mot de passe
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Doit contenir une majuscule')
  .regex(/[a-z]/, 'Doit contenir une minuscule')
  .regex(/[0-9]/, 'Doit contenir un chiffre')

// Schéma utilisateur
export const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(2, 'Prénom requis').max(50),
  lastName: z.string().min(2, 'Nom requis').max(50),
  phone: z.string().regex(/^\+?[\d\s-]{8,}$/, 'Numéro de téléphone invalide').optional(),
  company: z.string().max(100).optional(),
})

// Schéma inscription
export const registrationSchema = userSchema.extend({
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

// Schéma connexion
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
})

// Schéma article/news
export const articleSchema = z.object({
  title: z.string().min(5, 'Titre trop court').max(200, 'Titre trop long'),
  excerpt: z.string().min(10, 'Résumé trop court').max(500),
  content: z.string().min(50, 'Contenu trop court'),
  category: z.string().min(1, 'Catégorie requise'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags'),
  image: z.union([z.string().url(), z.instanceof(File)]).optional(),
  published: z.boolean(),
})

// Schéma produit
export const productSchema = z.object({
  name: z.string().min(3, 'Nom trop court').max(100),
  description: z.string().min(10, 'Description trop courte').max(2000),
  price: z.number().positive('Prix doit être positif'),
  comparePrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock ne peut pas être négatif'),
  sku: z.string().min(1, 'SKU requis'),
  category: z.string().min(1, 'Catégorie requise'),
  images: z.array(z.union([z.string().url(), z.instanceof(File)])).max(10),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
})

// Schéma CV
export const cvSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2, 'Prénom requis'),
    lastName: z.string().min(2, 'Nom requis'),
    email: emailSchema,
    phone: z.string().optional(),
    address: z.string().optional(),
    title: z.string().min(2, 'Titre professionnel requis'),
    summary: z.string().max(500, 'Résumé trop long').optional(),
  }),
  experience: z.array(z.object({
    company: z.string().min(2),
    position: z.string().min(2),
    startDate: z.string().regex(/^\d{4}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}$/).or(z.literal('present')),
    description: z.string().max(1000),
  })).max(10),
  education: z.array(z.object({
    institution: z.string().min(2),
    degree: z.string().min(2),
    field: z.string().min(2),
    startDate: z.string().regex(/^\d{4}$/),
    endDate: z.string().regex(/^\d{4}$/),
  })).max(5),
  skills: z.array(z.string().min(1)).max(20),
  languages: z.array(z.object({
    language: z.string().min(1),
    level: z.enum(['Débutant', 'Intermédiaire', 'Avancé', 'Natif']),
  })).max(5),
})

// Schéma business plan
export const businessPlanSchema = z.object({
  projectName: z.string().min(3, 'Nom du projet requis').max(100),
  sector: z.string().min(1, 'Secteur requis'),
  description: z.string().min(50, 'Description trop courte').max(2000),
  targetMarket: z.string().min(20, 'Marché cible requis').max(1000),
  revenueModel: z.string().min(20, 'Modèle de revenus requis').max(1000),
  initialInvestment: z.number().min(0, 'Investissement ne peut pas être négatif'),
  projectedRevenue: z.number().min(0).optional(),
  teamSize: z.number().int().min(1).max(1000),
  timeline: z.enum(['3 mois', '6 mois', '1 an', '2 ans', '3 ans+']),
})

// Schéma contact
export const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  email: emailSchema,
  subject: z.string().min(5, 'Sujet trop court').max(200),
  message: z.string().min(20, 'Message trop court').max(5000),
  category: z.enum(['support', 'sales', 'partnership', 'other']),
})

// Fonction helper pour valider
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.')
        acc[path] = err.message
        return acc
      }, {})
      return { success: false, data: null, errors }
    }
    throw error
  }
}

// Fonction pour valider partiellement (mode "draft")
export function validatePartial(schema, data) {
  try {
    const validated = schema.partial().parse(data)
    return { success: true, data: validated, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.')
        acc[path] = err.message
        return acc
      }, {})
      return { success: false, data: null, errors }
    }
    throw error
  }
}

// Fonction async pour valider avec transformation
export async function validateAsync(schema, data) {
  const result = schema.safeParseAsync(data)
  return result
}
