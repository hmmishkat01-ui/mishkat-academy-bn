import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Banknote, Calendar, Receipt } from 'lucide-react';

export default function AddPaymentDialog({ open, onClose, enrollment, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        new_payment: '',
        payment_method: '',
        payment_number: '',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_notes: '',
    });

    if (!enrollment) return null;

    const dueAmount = enrollment.due_amount || 0;
    const amountPaid = enrollment.amount_paid || 0;
    const payableAmount = enrollment.payable_amount || 0;

    const paymentStatusColors = {
        paid: 'bg-emerald-100 text-emerald-700',
        partial: 'bg-amber-100 text-amber-700',
        unpaid: 'bg-red-100 text-red-700',
        free: 'bg-blue-100 text-blue-700'
    };
    const paymentStatusLabels = { paid: 'পেইড', partial: 'আংশিক', unpaid: 'বাকি', free: 'ফ্রি' };

    const handleSubmit = async () => {
        const newPayment = parseFloat(formData.new_payment);
        if (!newPayment || newPayment <= 0) {
            toast.error('সঠিক পেমেন্ট পরিমাণ দিন');
            return;
        }
        if (newPayment > dueAmount) {
            toast.error(`বাকি টাকার চেয়ে বেশি দেওয়া যাবে না (সর্বোচ্চ ৳${dueAmount})`);
            return;
        }
        if (!formData.payment_method) {
            toast.error('পেমেন্ট পদ্ধতি বেছে নিন');
            return;
        }

        setLoading(true);
        try {
            const newAmountPaid = amountPaid + newPayment;
            const newDueAmount = payableAmount - newAmountPaid;
            const newPaymentStatus = newDueAmount <= 0 ? 'paid' : 'partial';

            await base44.entities.Enrollment.update(enrollment.id, {
                amount_paid: newAmountPaid,
                due_amount: Math.max(0, newDueAmount),
                payment_status: newPaymentStatus,
                payment_method: formData.payment_method,
                payment_number: formData.payment_number,
                transaction_id: formData.transaction_id,
                payment_date: formData.payment_date,
                payment_notes: formData.payment_notes,
            });

            toast.success(`৳${newPayment} পেমেন্ট সফলভাবে যোগ হয়েছে!`);
            onSuccess();
            onClose();
            setFormData({
                new_payment: '',
                payment_method: '',
                payment_number: '',
                transaction_id: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_notes: '',
            });
        } catch (error) {
            toast.error('পেমেন্ট যোগ করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-[var(--primary-color)]" />
                        নতুন পেমেন্ট যোগ করুন
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* কোর্স ও পেমেন্ট সারসংক্ষেপ */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-700">{enrollment.course_name}</span>
                            <Badge className={paymentStatusColors[enrollment.payment_status]}>
                                {paymentStatusLabels[enrollment.payment_status]}
                            </Badge>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>ব্যাচ:</span>
                            <span>{enrollment.batch_number}</span>
                        </div>
                        <div className="border-t pt-2 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-600">মোট পরিশোধযোগ্য:</span>
                                <span className="font-medium">৳{payableAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>আগে পরিশোধ করেছেন:</span>
                                <span className="font-semibold">৳{amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600 font-semibold border-t pt-1">
                                <span>এখনো বাকি:</span>
                                <span>৳{dueAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* নতুন পেমেন্ট পরিমাণ */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            এবার কত টাকা দিচ্ছেন? <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">৳</span>
                            <Input
                                type="number"
                                placeholder={`সর্বোচ্চ ${dueAmount}`}
                                value={formData.new_payment}
                                onChange={e => setFormData({ ...formData, new_payment: e.target.value })}
                                className="pl-7"
                                max={dueAmount}
                            />
                        </div>
                        {formData.new_payment && parseFloat(formData.new_payment) > 0 && (
                            <p className="text-xs text-emerald-600">
                                পেমেন্টের পর বাকি থাকবে: ৳{Math.max(0, dueAmount - parseFloat(formData.new_payment)).toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* পেমেন্ট পদ্ধতি */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            পেমেন্ট পদ্ধতি <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="বেছে নিন" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bkash">বিকাশ</SelectItem>
                                <SelectItem value="nagad">নগদ</SelectItem>
                                <SelectItem value="rocket">রকেট</SelectItem>
                                <SelectItem value="bank">ব্যাংক</SelectItem>
                                <SelectItem value="cash">ক্যাশ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* পেমেন্ট নম্বর ও ট্রানজেকশন */}
                    {formData.payment_method && formData.payment_method !== 'cash' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">পেমেন্ট নম্বর</Label>
                                <Input
                                    placeholder="01XXXXXXXXX"
                                    value={formData.payment_number}
                                    onChange={e => setFormData({ ...formData, payment_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">ট্রানজেকশন ID</Label>
                                <Input
                                    placeholder="TXN ID"
                                    value={formData.transaction_id}
                                    onChange={e => setFormData({ ...formData, transaction_id: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* তারিখ */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> পেমেন্টের তারিখ
                        </Label>
                        <Input
                            type="date"
                            value={formData.payment_date}
                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                        />
                    </div>

                    {/* নোট */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">নোট (ঐচ্ছিক)</Label>
                        <Input
                            placeholder="যেকোনো মন্তব্য..."
                            value={formData.payment_notes}
                            onChange={e => setFormData({ ...formData, payment_notes: e.target.value })}
                        />
                    </div>

                    {/* বাটন */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                            বাতিল
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                        >
                            <Receipt className="h-4 w-4 mr-2" />
                            {loading ? 'সেভ হচ্ছে...' : 'পেমেন্ট যোগ করুন'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
