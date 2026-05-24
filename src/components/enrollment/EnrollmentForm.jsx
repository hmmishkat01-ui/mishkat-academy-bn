import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

export default function EnrollmentForm({ open, onClose, student, enrollment, onSuccess }) {
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        course_id: '',
        course_name: '',
        batch_id: '',
        batch_number: '',
        is_free: true,
        course_price: 0,
        discount_type: '',
        discount_value: 0,
        discount_reason: '',
        discount_amount: 0,
        payable_amount: 0,
        amount_paid: 0,
        due_amount: 0,
        payment_status: 'free',
        payment_method: '',
        payment_number: '',
        transaction_id: '',
        payment_date: '',
        payment_notes: '',
        enroll_date: new Date().toISOString().split('T')[0],
        status: 'active'
    });

    useEffect(() => {
        if (open) {
            loadData();
            if (enrollment) {
                setFormData({
                    course_id: enrollment.course_id || '',
                    course_name: enrollment.course_name || '',
                    batch_id: enrollment.batch_id || '',
                    batch_number: enrollment.batch_number || '',
                    is_free: enrollment.is_free ?? true,
                    course_price: enrollment.course_price || 0,
                    discount_type: enrollment.discount_type || '',
                    discount_value: enrollment.discount_value || 0,
                    discount_reason: enrollment.discount_reason || '',
                    discount_amount: enrollment.discount_amount || 0,
                    payable_amount: enrollment.payable_amount || 0,
                    amount_paid: enrollment.amount_paid || 0,
                    due_amount: enrollment.due_amount || 0,
                    payment_status: enrollment.payment_status || 'free',
                    payment_method: enrollment.payment_method || '',
                    payment_number: enrollment.payment_number || '',
                    transaction_id: enrollment.transaction_id || '',
                    payment_date: enrollment.payment_date || '',
                    payment_notes: enrollment.payment_notes || '',
                    enroll_date: enrollment.enroll_date || new Date().toISOString().split('T')[0],
                    status: enrollment.status || 'active'
                });
            }
        }
    }, [open, enrollment]);

    const loadData = async () => {
        const [coursesData, batchesData] = await Promise.all([
            base44.entities.Course.list(),
            base44.entities.Batch.list()
        ]);
        setCourses(coursesData);
        setBatches(batchesData);
    };

    const calculateDiscount = (coursePrice, discountType, discountValue) => {
        if (!discountType || !discountValue) return 0;
        return discountType === 'percentage' ? (coursePrice * discountValue) / 100 : discountValue;
    };

    const handleCourseChange = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        const courseBatches = batches.filter(b => b.course_id === courseId);
        setFilteredBatches(courseBatches);
        
        const isFree = course?.is_free ?? true;
        const coursePrice = course?.price || 0;
        
        setFormData({
            ...formData,
            course_id: courseId,
            course_name: course?.name || '',
            batch_id: '',
            batch_number: '',
            is_free: isFree,
            course_price: coursePrice,
            payable_amount: coursePrice,
            due_amount: coursePrice,
            payment_status: isFree ? 'free' : 'unpaid'
        });
    };

    const handleDiscountChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        
        if (field === 'discount_type' || field === 'discount_value') {
            const discountAmount = calculateDiscount(
                newFormData.course_price,
                newFormData.discount_type,
                parseFloat(newFormData.discount_value) || 0
            );
            const payableAmount = Math.max(0, newFormData.course_price - discountAmount);
            
            newFormData.discount_amount = discountAmount;
            newFormData.payable_amount = payableAmount;
            newFormData.due_amount = payableAmount - newFormData.amount_paid;
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = async () => {
        if (!formData.course_id || !formData.batch_id) {
            toast.error('কোর্স এবং ব্যাচ সিলেক্ট করুন');
            return;
        }

        setLoading(true);
        try {
            const dueAmount = formData.payable_amount - formData.amount_paid;
            let paymentStatus = formData.payment_status;
            
            if (!formData.is_free) {
                if (formData.amount_paid >= formData.payable_amount) {
                    paymentStatus = 'paid';
                } else if (formData.amount_paid > 0) {
                    paymentStatus = 'partial';
                } else {
                    paymentStatus = 'unpaid';
                }
            }

            const receiptId = formData.amount_paid > 0 && !enrollment 
                ? `RC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
                : enrollment?.receipt_id || '';

            const enrollmentData = {
                ...formData,
                student_id: student.id,
                student_name: student.name,
                student_roll: student.roll_number,
                due_amount: dueAmount,
                payment_status: paymentStatus,
                receipt_id: receiptId
            };

            if (enrollment) {
                await base44.entities.Enrollment.update(enrollment.id, enrollmentData);
                toast.success('এনরোলমেন্ট আপডেট হয়েছে');
            } else {
                await base44.entities.Enrollment.create(enrollmentData);
                toast.success('নতুন কোর্সে ভর্তি হয়েছে');
            }
            
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {enrollment ? 'এনরোলমেন্ট এডিট করুন' : 'নতুন কোর্সে ভর্তি করুন'}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>কোর্স সিলেক্ট করুন *</Label>
                            <Select value={formData.course_id} onValueChange={handleCourseChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="কোর্স সিলেক্ট করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.name} {course.is_free ? '(ফ্রি)' : `(৳${course.price})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>ব্যাচ সিলেক্ট করুন *</Label>
                            <Select 
                                value={formData.batch_id} 
                                onValueChange={(value) => {
                                    const batch = batches.find(b => b.id === value);
                                    setFormData({...formData, batch_id: value, batch_number: batch?.batch_number || ''});
                                }}
                                disabled={!formData.course_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ব্যাচ সিলেক্ট করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredBatches.map(batch => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                            {batch.batch_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ভর্তির তারিখ</Label>
                            <Input
                                type="date"
                                value={formData.enroll_date}
                                onChange={(e) => setFormData({...formData, enroll_date: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>স্ট্যাটাস</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">চলমান</SelectItem>
                                    <SelectItem value="completed">সম্পন্ন</SelectItem>
                                    <SelectItem value="dropped">বাদ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {!formData.is_free && (
                        <>
                            {/* ... keep existing code (discount and payment sections) ... */}
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-slate-800">ডিসকাউন্ট সিস্টেম</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ডিসকাউন্ট টাইপ</Label>
                                        <Select 
                                            value={formData.discount_type} 
                                            onValueChange={(value) => handleDiscountChange('discount_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="ডিসকাউন্ট টাইপ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>কোনো ডিসকাউন্ট নেই</SelectItem>
                                                <SelectItem value="percentage">পার্সেন্টেজ (%)</SelectItem>
                                                <SelectItem value="fixed">নির্দিষ্ট টাকা (৳)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {formData.discount_type && (
                                        <div className="space-y-2">
                                            <Label>
                                                {formData.discount_type === 'percentage' ? 'ডিসকাউন্ট (%)' : 'ডিসকাউন্ট (৳)'}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.discount_value}
                                                onChange={(e) => handleDiscountChange('discount_value', parseFloat(e.target.value) || 0)}
                                                placeholder={formData.discount_type === 'percentage' ? '20' : '1000'}
                                            />
                                        </div>
                                    )}
                                </div>

                                {formData.discount_type && (
                                    <div className="space-y-2">
                                        <Label>ডিসকাউন্টের কারণ</Label>
                                        <Select 
                                            value={formData.discount_reason} 
                                            onValueChange={(value) => setFormData({...formData, discount_reason: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="কারণ সিলেক্ট করুন" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="special_offer">বিশেষ অফার</SelectItem>
                                                <SelectItem value="financial_support">আর্থিক সহায়তা</SelectItem>
                                                <SelectItem value="ramadan_offer">রমজান অফার</SelectItem>
                                                <SelectItem value="early_batch">আর্লি ব্যাচ অফার</SelectItem>
                                                <SelectItem value="authority_approved">কর্তৃপক্ষ অনুমোদিত</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">কোর্স ফি:</span>
                                    <span className="font-semibold">৳{formData.course_price?.toFixed(2) || '0.00'}</span>
                                </div>
                                {formData.discount_amount > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-red-600">
                                        <span className="text-sm">
                                            ডিসকাউন্ট ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : '৳'}):
                                        </span>
                                        <span className="font-semibold">–৳{formData.discount_amount?.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-slate-300">
                                    <span className="text-sm font-medium text-slate-700">পরিশোধযোগ্য:</span>
                                    <span className="font-bold text-blue-600">৳{formData.payable_amount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">পরিশোধিত:</span>
                                    <span className="font-semibold text-emerald-600">৳{formData.amount_paid?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-sm font-medium text-slate-700">বাকি:</span>
                                    <span className="font-bold text-red-600">৳{(formData.payable_amount - formData.amount_paid)?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>পরিশোধিত টাকা</Label>
                                    <Input
                                        type="number"
                                        value={formData.amount_paid}
                                        onChange={(e) => setFormData({...formData, amount_paid: parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>পেমেন্ট মেথড</Label>
                                    <Select 
                                        value={formData.payment_method} 
                                        onValueChange={(value) => setFormData({...formData, payment_method: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="মেথড সিলেক্ট করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bkash">বিকাশ</SelectItem>
                                            <SelectItem value="nagad">নগদ</SelectItem>
                                            <SelectItem value="rocket">রকেট</SelectItem>
                                            <SelectItem value="bank">ব্যাংক ট্রান্সফার</SelectItem>
                                            <SelectItem value="cash">ক্যাশ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>পেমেন্ট নাম্বার</Label>
                                    <Input
                                        value={formData.payment_number}
                                        onChange={(e) => setFormData({...formData, payment_number: e.target.value})}
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ট্রানজেকশন আইডি</Label>
                                    <Input
                                        value={formData.transaction_id}
                                        onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                                        placeholder="TXN123456"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>পেমেন্ট তারিখ</Label>
                                <Input
                                    type="date"
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>নোট (অপশনাল)</Label>
                                <Input
                                    value={formData.payment_notes}
                                    onChange={(e) => setFormData({...formData, payment_notes: e.target.value})}
                                    placeholder="কোনো বিশেষ তথ্য থাকলে লিখুন"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            বাতিল
                        </Button>
                        <Button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                        >
                            {loading ? 'প্রসেসিং...' : enrollment ? 'আপডেট করুন' : 'ভর্তি করুন'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}