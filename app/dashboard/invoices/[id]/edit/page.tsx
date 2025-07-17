import Form from '@/app/ui/invoices/edit-form'
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs'
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data'
import { Customer, Invoice } from '../../../../lib/definitions'
import { updateInvoice } from '../../../../lib/actions'

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = params.id

  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers()
  ])
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id)
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true
          }
        ]}
      />
      <Form
        invoice={invoice}
        customers={customers}
        updateInvoiceWithId={updateInvoiceWithId}
      />
    </main>
  )
}
