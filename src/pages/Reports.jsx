import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
    FileText, 
    Users, 
    BookOpen, 
    TrendingUp,
    Gift,
    CreditCard,
    Download,
    Layers,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function Reports() {
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesData, batchesData, enrollmentsData] = await Promise.all([
                base44.entities.Course.list(),
                base44.entities.Batch.list(),
                base44.entities.Enrollment.list()
            ]);
            setCourses(coursesData);
            setBatches(batchesData);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // কোর্সভিত্তিক রিপোর্ট
    const getCourseStats = () => {
        return courses.map(course => {
            const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
            const totalStudents = courseEnrollments.length;
            const totalIncome = courseEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
            const totalDue = courseEnrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
            const totalPayable = courseEnrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);
            
            const paidCount = courseEnrollments.filter(e => e.payment_status === 'paid').length;
            const partialCount = courseEnrollments.filter(e => e.payment_status === 'partial').length;
            const unpaidCount = courseEnrollments.filter(e => e.payment_status === 'unpaid').length;
            const freeCount = courseEnrollments.filter(e => e.payment_status === 'free' || e.is_free).length;

            return {
                course_id: course.id,
                name: course.name,
                is_free: course.is_free,
                course_fee: course.price || 0,
                students: totalStudents,
                totalPayable,
                totalIncome,
                totalDue,
                paidCount,
                partialCount,
                unpaidCount,
                freeCount
            };
        }).sort((a, b) => b.totalIncome - a.totalIncome);
    };

    // ব্যাচভিত্তিক রিপোর্ট
    const getBatchStats = () => {
        return batches.map(batch => {
            const batchEnrollments = enrollments.filter(e => e.batch_id === batch.id);
            const totalStudents = batchEnrollments.length;
            const totalIncome = batchEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
            const totalDue = batchEnrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
            const totalPayable = batchEnrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);

            return {
                batch_id: batch.id,
                batch_number: batch.batch_number,
                course_name: batch.course_name,
                students: totalStudents,
                totalPayable,
                totalIncome,
                totalDue,
                status: batch.status
            };
        }).sort((a, b) => b.totalIncome - a.totalIncome);
    };

    // পেমেন্ট স্ট্যাটাস রিপোর্ট
    const getPaymentStats = () => {
        const paid = enrollments.filter(e => e.payment_status === 'paid').length;
        const partial = enrollments.filter(e => e.payment_status === 'partial').length;
        const unpaid = enrollments.filter(e => e.payment_status === 'unpaid').length;
        const free = enrollments.filter(e => e.payment_status === 'free' || e.is_free).length;
        
        return [
            { name: 'সম্পূর্ণ পেইড', value: paid, color: '#10b981' },
            { name: 'আংশিক পেইড', value: partial, color: '#f59e0b' },
            { name: 'বাকি আছে', value: unpaid, color: '#ef4444' },
            { name: 'ফ্রি', value: free, color: '#3b82f6' }
        ];
    };

    // আয় ও বাকির তথ্য
    const getFinancialSummary = () => {
        const totalPayable = enrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);
        const totalIncome = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
        const totalDue = enrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
        const collectionRate = totalPayable > 0 ? ((totalIncome / totalPayable) * 100).toFixed(1) : 0;

        return { totalPayable, totalIncome, totalDue, collectionRate };
    };


    // ===== EXCEL DOWNLOAD FUNCTIONS =====

    const downloadEnrollmentsExcel = async () => {
        setDownloading('enrollments');
        try {
            const data = enrollments.map(e => {
                const student = students.find(s => s.id === e.student_id);
                return {
                    'স্টুডেন্টের নাম': e.student_name || student?.name || '',
                    'রোল নম্বর': e.student_roll || student?.roll_number || '',
                    'ফোন': student?.phone || '',
                    'ইমেইল': student?.email || '',
                    'কোর্স': e.course_name || '',
                    'ব্যাচ': e.batch_number || '',
                    'ভর্তির তারিখ': e.enroll_date || '',
                    'কোর্স ফি': e.course_price || 0,
                    'ডিসকাউন্ট': e.discount_amount || 0,
                    'পরিশোধযোগ্য': e.payable_amount || 0,
                    'পরিশোধিত': e.amount_paid || 0,
                    'বাকি': e.due_amount || 0,
                    'পেমেন্ট স্ট্যাটাস': { paid: 'পেইড', partial: 'আংশিক', unpaid: 'বাকি', free: 'ফ্রি' }[e.payment_status] || '',
                    'পেমেন্ট পদ্ধতি': e.payment_method || '',
                    'ট্রানজেকশন ID': e.transaction_id || '',
                    'স্ট্যাটাস': { active: 'চলমান', completed: 'সম্পন্ন', dropped: 'বাদ' }[e.status] || '',
                    'সার্টিফিকেট': e.certificate_issued ? 'হ্যাঁ' : 'না',
                };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'এনরোলমেন্ট');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
            XLSX.writeFile(wb, `এনরোলমেন্ট_রিপোর্ট_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    const downloadDuePaymentsExcel = async () => {
        setDownloading('due');
        try {
            const dueEnrollments = enrollments.filter(e => e.due_amount > 0);
            const data = dueEnrollments.map(e => {
                const student = students.find(s => s.id === e.student_id);
                return {
                    'স্টুডেন্টের নাম': e.student_name || student?.name || '',
                    'রোল নম্বর': e.student_roll || student?.roll_number || '',
                    'ফোন': student?.phone || '',
                    'কোর্স': e.course_name || '',
                    'ব্যাচ': e.batch_number || '',
                    'পরিশোধযোগ্য': e.payable_amount || 0,
                    'পরিশোধিত': e.amount_paid || 0,
                    'বাকি টাকা': e.due_amount || 0,
                    'পেমেন্ট স্ট্যাটাস': { paid: 'পেইড', partial: 'আংশিক', unpaid: 'বাকি', free: 'ফ্রি' }[e.payment_status] || '',
                };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'বাকি পেমেন্ট');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
            XLSX.writeFile(wb, `বাকি_পেমেন্ট_রিপোর্ট_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    const downloadCourseReportExcel = async () => {
        setDownloading('course');
        try {
            const data = getCourseStats().map(c => ({
                'কোর্সের নাম': c.name,
                'ধরন': c.is_free ? 'ফ্রি' : 'পেইড',
                'কোর্স ফি': c.course_fee,
                'মোট স্টুডেন্ট': c.students,
                'মোট পরিশোধযোগ্য': c.totalPayable,
                'মোট আয়': c.totalIncome,
                'মোট বাকি': c.totalDue,
                'পেইড': c.paidCount,
                'আংশিক': c.partialCount,
                'বাকি': c.unpaidCount,
                'ফ্রি': c.freeCount,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'কোর্স রিপোর্ট');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 16 }));
            XLSX.writeFile(wb, `কোর্স_রিপোর্ট_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    const downloadBatchReportExcel = async () => {
        setDownloading('batch');
        try {
            const data = getBatchStats().map(b => ({
                'ব্যাচ নম্বর': b.batch_number,
                'কোর্স': b.course_name,
                'স্ট্যাটাস': { active: 'চলমান', completed: 'সম্পন্ন', upcoming: 'আসন্ন' }[b.status] || b.status,
                'মোট স্টুডেন্ট': b.students,
                'মোট পরিশোধযোগ্য': b.totalPayable,
                'মোট আয়': b.totalIncome,
                'মোট বাকি': b.totalDue,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'ব্যাচ রিপোর্ট');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 16 }));
            XLSX.writeFile(wb, `ব্যাচ_রিপোর্ট_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    const courseStats = getCourseStats();
    const batchStats = getBatchStats();
    const paymentStats = getPaymentStats();
    const financialSummary = getFinancialSummary();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">রিপোর্ট ও হিসাব</h1>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-100">মোট স্টুডেন্ট</p>
                                <p className="text-3xl font-bold">{enrollments.length}</p>
                                <p className="text-xs text-blue-100 mt-1">এনরোলমেন্ট</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-100">মোট ফি</p>
                                <p className="text-3xl font-bold">৳{financialSummary.totalPayable.toLocaleString('bn-BD')}</p>
                                <p className="text-xs text-purple-100 mt-1">পরিশোধযোগ্য</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-100">মোট আয়</p>
                                <p className="text-3xl font-bold">৳{financialSummary.totalIncome.toLocaleString('bn-BD')}</p>
                                <p className="text-xs text-emerald-100 mt-1">{financialSummary.collectionRate}% কালেকশন</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-100">মোট বাকি</p>
                                <p className="text-3xl font-bold">৳{financialSummary.totalDue.toLocaleString('bn-BD')}</p>
                                <p className="text-xs text-red-100 mt-1">অসম্পূর্ণ পেমেন্ট</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="courses">কোর্সভিত্তিক</TabsTrigger>
                    <TabsTrigger value="batches">ব্যাচভিত্তিক</TabsTrigger>
                    <TabsTrigger value="payment">পেমেন্ট</TabsTrigger>
                </TabsList>

                {/* কোর্সভিত্তিক রিপোর্ট */}
                <TabsContent value="courses" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-[var(--primary-color)]" />
                                কোর্সভিত্তিক বিস্তারিত রিপোর্ট
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">কোর্স</TableHead>
                                            <TableHead className="text-center">স্টুডেন্ট</TableHead>
                                            <TableHead className="text-right">কোর্স ফি</TableHead>
                                            <TableHead className="text-right">মোট আয়</TableHead>
                                            <TableHead className="text-right">বাকি</TableHead>
                                            <TableHead className="text-center">পেমেন্ট স্ট্যাটাস</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courseStats.map((course, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {course.name}
                                                        {course.is_free && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-xs">ফ্রি</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-semibold">
                                                        {course.students} জন
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-purple-600">
                                                    ৳{course.course_fee.toLocaleString('bn-BD')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-emerald-600">
                                                    ৳{course.totalIncome.toLocaleString('bn-BD')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-red-600">
                                                    ৳{course.totalDue.toLocaleString('bn-BD')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {course.paidCount > 0 && (
                                                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                                                পেইড: {course.paidCount}
                                                            </Badge>
                                                        )}
                                                        {course.partialCount > 0 && (
                                                            <Badge className="bg-amber-100 text-amber-700 text-xs">
                                                                আংশিক: {course.partialCount}
                                                            </Badge>
                                                        )}
                                                        {course.unpaidCount > 0 && (
                                                            <Badge className="bg-red-100 text-red-700 text-xs">
                                                                বাকি: {course.unpaidCount}
                                                            </Badge>
                                                        )}
                                                        {course.freeCount > 0 && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                                ফ্রি: {course.freeCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Chart */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">কোর্সভিত্তিক আয়</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={courseStats}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip 
                                                formatter={(value) => [`৳${value.toLocaleString('bn-BD')}`, 'আয়']}
                                            />
                                            <Bar dataKey="totalIncome" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ব্যাচভিত্তিক রিপোর্ট */}
                <TabsContent value="batches" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-[var(--primary-color)]" />
                                ব্যাচভিত্তিক বিস্তারিত রিপোর্ট
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ব্যাচ</TableHead>
                                            <TableHead>কোর্স</TableHead>
                                            <TableHead className="text-center">স্টুডেন্ট</TableHead>
                                            <TableHead className="text-right">মোট ফি</TableHead>
                                            <TableHead className="text-right">আয়</TableHead>
                                            <TableHead className="text-right">বাকি</TableHead>
                                            <TableHead className="text-center">স্ট্যাটাস</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batchStats.map((batch, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{batch.batch_number}</TableCell>
                                                <TableCell>{batch.course_name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-semibold">
                                                        {batch.students} জন
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-purple-600">
                                                    ৳{batch.totalPayable.toLocaleString('bn-BD')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-emerald-600">
                                                    ৳{batch.totalIncome.toLocaleString('bn-BD')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-red-600">
                                                    ৳{batch.totalDue.toLocaleString('bn-BD')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={
                                                        batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                        batch.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }>
                                                        {batch.status === 'active' ? 'চলমান' : 
                                                         batch.status === 'completed' ? 'সম্পন্ন' : 'আসন্ন'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* পেমেন্ট স্ট্যাটাস */}
                <TabsContent value="payment" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>পেমেন্ট স্ট্যাটাস</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {paymentStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>পেমেন্ট সারাংশ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {paymentStats.map((stat, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl"
                                        style={{ backgroundColor: `${stat.color}15` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: stat.color }}
                                            />
                                            <span className="font-medium">{stat.name}</span>
                                        </div>
                                        <span className="text-2xl font-bold" style={{ color: stat.color }}>
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}

                                <div className="pt-4 mt-4 border-t space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">মোট এনরোলমেন্ট</span>
                                        <span className="text-2xl font-bold text-slate-800">
                                            {enrollments.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">কালেকশন রেট</span>
                                        <span className="text-2xl font-bold text-purple-600">
                                            {financialSummary.collectionRate}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}