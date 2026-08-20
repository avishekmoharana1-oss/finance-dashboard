// Demo dataset — clearly labelled as DEMO DATA. Replaced when real files are uploaded.
import { addDays } from './dates';

const today = new Date();

export const DEMO_RTGS = [
  { txnNo: 'RTGS000101', date: addDays(today, -2), party: 'Acme Industries', amount: 150000, status: 'Successful', reference: 'INV-2024-001', bank: 'HDFC Bank', accountNo: '501001234', remarks: 'Payment against invoice', invoiceNo: 'INV-2024-001' },
  { txnNo: 'RTGS000102', date: addDays(today, -5), party: 'Globex Corp', amount: 87500, status: 'Successful', reference: 'INV-2024-002', bank: 'ICICI Bank', accountNo: '501005678', remarks: 'Invoice settlement', invoiceNo: 'INV-2024-002' },
  { txnNo: 'RTGS000103', date: addDays(today, -8), party: 'Stark Logistics', amount: 45000, status: 'Pending', reference: 'INV-2024-003', bank: 'SBI', accountNo: '501009012', remarks: 'Awaiting confirmation', invoiceNo: 'INV-2024-003' },
  { txnNo: 'RTGS000104', date: addDays(today, -12), party: 'Wayne Trading', amount: 230000, status: 'Failed', reference: 'INV-2024-004', bank: 'Axis Bank', accountNo: '501003456', remarks: 'Insufficient funds', invoiceNo: 'INV-2024-004' },
  { txnNo: 'RTGS000105', date: addDays(today, -15), party: 'Acme Industries', amount: 92000, status: 'Successful', reference: 'INV-2024-005', bank: 'HDFC Bank', accountNo: '501001234', remarks: 'Partial payment', invoiceNo: 'INV-2024-005' },
  { txnNo: 'RTGS000106', date: addDays(today, -20), party: 'Umbrella Pharma', amount: 310000, status: 'Successful', reference: 'INV-2024-006', bank: 'Kotak', accountNo: '501007890', remarks: 'Bulk order payment', invoiceNo: 'INV-2024-006' },
  { txnNo: 'RTGS000107', date: addDays(today, -25), party: 'Globex Corp', amount: 56000, status: 'Processing', reference: 'INV-2024-007', bank: 'ICICI Bank', accountNo: '501005678', remarks: 'Under review', invoiceNo: 'INV-2024-007' },
  { txnNo: 'RTGS000108', date: addDays(today, -35), party: 'Stark Logistics', amount: 124000, status: 'Successful', reference: 'INV-2024-008', bank: 'SBI', accountNo: '501009012', remarks: 'Monthly settlement', invoiceNo: 'INV-2024-008' },
];

export const DEMO_BILLING = [
  { invoiceNo: 'INV-2024-001', date: addDays(today, -10), party: 'Acme Industries', amount: 150000, paidAmount: 150000, dueDate: addDays(today, -3), paymentDate: addDays(today, -2), status: 'Paid', remarks: 'Cleared' },
  { invoiceNo: 'INV-2024-002', date: addDays(today, -12), party: 'Globex Corp', amount: 87500, paidAmount: 87500, dueDate: addDays(today, -5), paymentDate: addDays(today, -5), status: 'Paid', remarks: 'Cleared' },
  { invoiceNo: 'INV-2024-003', date: addDays(today, -15), party: 'Stark Logistics', amount: 45000, paidAmount: 0, dueDate: addDays(today, -2), paymentDate: null, status: 'Pending', remarks: '' },
  { invoiceNo: 'INV-2024-004', date: addDays(today, -18), party: 'Wayne Trading', amount: 230000, paidAmount: 0, dueDate: addDays(today, -6), paymentDate: null, status: 'Pending', remarks: 'Payment failed' },
  { invoiceNo: 'INV-2024-005', date: addDays(today, -20), party: 'Acme Industries', amount: 120000, paidAmount: 92000, dueDate: addDays(today, -8), paymentDate: addDays(today, -15), status: 'Partially Paid', remarks: 'Balance pending' },
  { invoiceNo: 'INV-2024-006', date: addDays(today, -25), party: 'Umbrella Pharma', amount: 310000, paidAmount: 310000, dueDate: addDays(today, -10), paymentDate: addDays(today, -20), status: 'Paid', remarks: 'Cleared' },
  { invoiceNo: 'INV-2024-007', date: addDays(today, -30), party: 'Globex Corp', amount: 56000, paidAmount: 0, dueDate: addDays(today, -15), paymentDate: null, status: 'Pending', remarks: '' },
  { invoiceNo: 'INV-2024-008', date: addDays(today, -40), party: 'Stark Logistics', amount: 124000, paidAmount: 124000, dueDate: addDays(today, -25), paymentDate: addDays(today, -35), status: 'Paid', remarks: 'Cleared' },
  { invoiceNo: 'INV-2024-009', date: addDays(today, -45), party: 'Wayne Trading', amount: 67000, paidAmount: 30000, dueDate: addDays(today, -18), paymentDate: addDays(today, -30), status: 'Partially Paid', remarks: '' },
  { invoiceNo: 'INV-2024-010', date: addDays(today, -50), party: 'Umbrella Pharma', amount: 210000, paidAmount: 0, dueDate: addDays(today, -22), paymentDate: null, status: 'Pending', remarks: 'Awaiting payment' },
];

export const DEMO_CURRENCY = '₹';
