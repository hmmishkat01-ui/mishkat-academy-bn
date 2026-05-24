import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, IdCard, Receipt, BookOpen, CreditCard, CheckCircle2 } from 'lucide-react';
import IDCardComponent from '../student/IDCardComponent';
import CertificateComponent from '../student/CertificateComponent';

const paymentStatusColors = {
    paid: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-amber-100 text-amber-700',
    unpaid: 'bg-red-100 text-red-700',
    free: 'bg-blue-100 text-blue-700'
};
const paymentStatusLabels = { paid: 'পেইড', partial: 'আংশিক', unpaid: 'বাকি', free: 'ফ্রি' };

export default function EnrollmentDetailModal({ enrollment, student, settings, open, onClose, onIssueCertificate, onEdit, onViewReceipt }) {
    const [idCardOpen, setIdCardOpen] = useState(false);
    const [certOpen, setCertOpen] = useState(false);

    if (!enrollment || !student) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-[var(--primary-color)]" />
                            {enrollment.course_name}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="payment">
                        <TabsList className="w-full">
                            <TabsTrigger value="payment" className="flex-1">
                                <CreditCard className="h-4 w-4 mr-1" />
                                পেমেন্ট
                            </TabsTrigger>
                            <TabsTrigger value="docs" className="flex-1">
                                <Award className="h-4 w-4 mr-1" />
                                ডকুমেন্ট
                            </TabsTrigger>
                        </TabsList>

                        {/* Payment Tab */}
                        <TabsContent value="payment" className="space-y-4 pt-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm text-slate-600">ব্যাচ</span>
                                <span className="font-semibold text-slate-800">{enrollment.batch_number}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm text-slate-600">স্ট্যাটাস</span>
                                <Badge className={paymentStatusColors[enrollment.payment_status]}>
                                    {paymentStatusLabels[enrollment.payment_status]}
                                </Badge>
                            </div>

                            {!enrollment.is_free && (
                                <div className="rounded-xl border overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 border-b">আর্থিক বিবরণ</div>
                                    <div className="divide-y">
                                        <div className="flex justify-between px-4 py-3 text-sm">
                                            <span className="text-slate-600">কোর্স ফি</span>
                                            <span className="font-medium">৳{enrollment.course_price?.toLocaleString('bn-BD')}</span>
                                        </div>
                                        {enrollment.discount_amount > 0 && (
                                            <div className="flex justify-between px-4 py-3 text-sm">
                                                <span className="text-red-600">ডিসকাউন্ট</span>
                                                <span className="font-medium text-red-600">–৳{enrollment.discount_amount?.toLocaleString('bn-BD')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between px-4 py-3 text-sm">
                                            <span className="text-blue-700 font-medium">পরিশোধযোগ্য</span>
                                            <span className="font-bold text-blue-700">৳{enrollment.payable_amount?.toLocaleString('bn-BD')}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-3 text-sm bg-emerald-50">
                                            <span className="text-emerald-700 font-medium">পরিশোধিত</span>
                                            <span className="font-bold text-emerald-700">৳{enrollment.amount_paid?.toLocaleString('bn-BD')}</span>
                                        </div>
                                        {enrollment.due_amount > 0 && (
                                            <div className="flex justify-between px-4 py-3 text-sm bg-red-50">
                                                <span className="text-red-700 font-medium">বাকি</span>
                                                <span className="font-bold text-red-700">৳{enrollment.due_amount?.toLocaleString('bn-BD')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {enrollment.enroll_date && (
                                <p className="text-xs text-slate-500 text-center">
                                    ভর্তির তারিখ: {new Date(enrollment.enroll_date).toLocaleDateString('bn-BD')}
                                </p>
                            )}

                            <div className="flex gap-2">
                                {!enrollment.is_free && (
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { onEdit(enrollment); onClose(); }}>
                                        পেমেন্ট যোগ
                                    </Button>
                                )}
                                {enrollment.amount_paid > 0 && (
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { onViewReceipt(enrollment); onClose(); }}>
                                        <Receipt className="h-4 w-4 mr-1" />
                                        রশিদ
                                    </Button>
                                )}
                            </div>
                        </TabsContent>

                        {/* Documents Tab */}
                        <TabsContent value="docs" className="space-y-3 pt-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start h-14"
                                onClick={() => setIdCardOpen(true)}
                            >
                                <IdCard className="h-5 w-5 mr-3 text-blue-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-slate-800">ID কার্ড</p>
                                    <p className="text-xs text-slate-500">ডাউনলোড বা শেয়ার করুন</p>
                                </div>
                            </Button>

                            {enrollment.certificate_issued ? (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-14 border-emerald-300 bg-emerald-50"
                                    onClick={() => setCertOpen(true)}
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-3 text-emerald-600" />
                                    <div className="text-left">
                                        <p className="font-semibold text-emerald-800">সার্টিফিকেট দেখুন</p>
                                        <p className="text-xs text-emerald-600">ID: {enrollment.certificate_id}</p>
                                    </div>
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-14 border-amber-300 bg-amber-50"
                                    onClick={() => { onIssueCertificate(enrollment); onClose(); }}
                                >
                                    <Award className="h-5 w-5 mr-3 text-amber-600" />
                                    <div className="text-left">
                                        <p className="font-semibold text-amber-800">সার্টিফিকেট ইস্যু করুন</p>
                                        <p className="text-xs text-amber-600">এখনো ইস্যু হয়নি</p>
                                    </div>
                                </Button>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {idCardOpen && (
                <IDCardComponent
                    student={student}
                    course={enrollment.course_name}
                    batch={enrollment.batch_number}
                    settings={settings}
                    open={idCardOpen}
                    onClose={() => setIdCardOpen(false)}
                />
            )}

            {certOpen && enrollment.certificate_issued && (
                <CertificateComponent
                    student={student}
                    enrollment={enrollment}
                    settings={settings}
                    open={certOpen}
                    onClose={() => setCertOpen(false)}
                />
            )}
        </>
    );
}