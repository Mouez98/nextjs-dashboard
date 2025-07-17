import { z } from 'zod'

import postgres from 'postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string()
})

const CreateInvoice = FormSchema.omit({ id: true, date: true })
const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(formData: FormData) {
  'use server'
  const rowFormData = {
    customerId: formData.get('customerId'),
    status: formData.get('status'),
    amount: formData.get('amount')
  }
  const { amount, customerId, status } = CreateInvoice.parse(rowFormData)

  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0]

  try {
    await sql`insert into invoices(amount, customer_id, date, status)
          values(${amountInCents}, ${customerId}, ${date}, ${status})
      `
  } catch (error) {
    console.error(error)
  }
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}
export async function updateInvoice(id: string, formData: FormData) {
  'use server'
  const rowFormData = {
    customerId: formData.get('customerId'),
    status: formData.get('status'),
    amount: formData.get('amount')
  }
  const { amount, customerId, status } = UpdateInvoice.parse(rowFormData)

  const amountInCents = amount * 100

  try {
    await sql`update invoices
          set customer_id =${customerId}, amount = ${amountInCents}, status = ${status}
          where id = ${id}
          `
  } catch (error) {
    console.error(error)
  }
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  'use server'
  throw new Error('Failed to delete invoice')

  await sql`delete from invoices where id = ${id}`
  revalidatePath('/dashboard/invoices')
}
