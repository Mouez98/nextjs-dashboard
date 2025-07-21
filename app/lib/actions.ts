'use server'

import { z } from 'zod'

import postgres from 'postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer'
  }),
  amount: z.coerce.number().gt(0, 'Please enter an amount greater than $0'),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select a status'
  }),
  date: z.string()
})

export type State = {
  errors?: {
    customerId?: string[]
    amount?: string[]
    status?: string[]
  }
  message?: string | null
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })
const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(prevState: State, formData: FormData) {
  const rowFormData = {
    customerId: formData.get('customerId'),
    status: formData.get('status'),
    amount: formData.get('amount')
  }
  const validatedFields = CreateInvoice.safeParse(rowFormData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create invoice, missing fields'
    }
  }

  const { customerId, amount, status } = validatedFields.data

  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0]

  try {
    await sql`insert into invoices(amount, customer_id, date, status)
          values(${amountInCents}, ${customerId}, ${date}, ${status})
      `
  } catch (error) {
    return {
      message: 'Database Error, Failed to Create Invoice. '
    }
  }
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const rowFormData = {
    customerId: formData.get('customerId'),
    status: formData.get('status'),
    amount: formData.get('amount')
  }
  const { data, success, error } = UpdateInvoice.safeParse(rowFormData)

  if (!success) {
    return {
      errors: error.flatten().fieldErrors,
      message: 'Failed to update invoice, missing fields'
    }
  }
  const { amount, customerId, status } = data

  const amountInCents = amount * 100

  try {
    await sql`update invoices
          set customer_id =${customerId}, amount = ${amountInCents}, status = ${status}
          where id = ${id}
          `
  } catch (error) {
    return {
      message: 'Server error, Failed to update invoice'
    }
  }
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  await sql`delete from invoices where id = ${id}`
  revalidatePath('/dashboard/invoices')
}
