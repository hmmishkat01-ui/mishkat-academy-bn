import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    ArrowLeft, Users, Phone, Mail, Eye, Layers, Calendar,
    CheckCircle2, Clock, Link as LinkIcon, Search, Filter,
    CreditCard, AlertCircle, CheckCheck, Gift, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import AddPaymentDialog from '../components/enrollment/AddPaymentDialog';

export default function BatchStudents() {
    const [batch, setBatch] = useState(null);
    const [course, setCourse] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [students, setStudents] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const batchId = urlParams.get('id');
            if (!batchId) { setLoading(false); return; }
            const [batchData, enrollmentsData] = await Promise.all([
                base44.entities.Batch.filter({ id: batchId }),
                base44.entities.Enrollment.filter({ batch_id: batchId })
            ]);
            if (batchData.length > 0) {
                setBatch(batchData[0]);
                const [courseData, modulesData] = await Promise.all([
                    base44.entities.Course.filter({ id: batchData[0].course_id }),
                    base44.entities.CourseModule.filter({ course_id: batchData[0].course_id })
                ]);
                if (courseData.length > 0) setCourse(courseData[0]);
                setModules(modulesData.sort((a, b) => (a.class_number || 0) - (b.class_number || 0)));
            }
            setEnrollments(enrollmentsData || []);
            if (enrollmentsData && enrollmentsData.length > 0) {
                const studentIds = enrollmentsData.map(e => e.student_id);
                const studentsData = await base44.entities.Student.list();
                setStudents(studentsData.filter(s => studentIds.includes(s.id)));
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setStudents([]); setEnrollments([]);
        } finally {
            setLoading(false);
        }
    };

    const getEnrollment = (studentId) => enrollments.find(e => e.student_id === studentId);

    const filteredStudents = students.filter(student => {
        const enrollment = getEnrollment(student.id);
        if (searchText) {
            const q = searchText.toLowerCase();
            if (!student.name?.toLowerCase().includes(q) &&
                !student.phone?.includes(q) &&
                !student.roll_number?.includes(q) &&
                !student.email?.toLowerCase().includes(q)) return false;
        }
        if (paymentFilter !== 'all') {
            if (!enrollment) return false;
            if (paymentFilter === 'due' && !(enrollment.due_amount > 0)) return false;
            if (paymentFilter !== 'due' && enrollment.payment_status !== paymentFilter) return false;
        }
        if (statusFilter !== 'all') {
            if (!enrollment || enrollment.status !== statusFilter) return false;
        }
        return true;
    });

    const pColors = { paid: 'bg-emerald-100 text-emerald-700', partial: 'bg-amber-100 text-amber-700', unpaid: 'bg-red-100 text-red-700', free: 'bg-blue-100 text-blue-700' };
    const pLabels = { paid: 'পেইড', partial: 'আংশিক', unpaid: 'বাকি', free: 'ফ্রি' };
    const sColors = { active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', dropped: 'bg-red-100 text-red-700' };
    const sLabels = { active: 'চলমান', completed: 'সম্পন্ন', dropped: 'বাদ' };

    const stats = {
        totalPaid: enrollments.reduce((s, e) => s + (e.amount_paid || 0), 0),
        totalDue: enrollments.reduce((s, e) => s + (e.due_amount || 0), 0),
        paidCount: enrollments.filter(e => e.payment_status === 'paid').length,
        partialCount: enrollments.filter(e => e.payment_status === 'partial').length,
        unpaidCount: enrollments.filter(e => e.payment_status === 'unpaid').length,
        freeCount: enrollments.filter(e => e.payment_status === 'free').length,
    };

    if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>;

    if (!batch) return (
        <div className="text-center py-16">
            <p className="text-slate-500 mb-4">ব্যাচ পাওয়া যায়নি</p>
            <Link to={createPageUrl('Batches')}><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />ব্যাচ লিস্টে ফিরুন</Button></Link>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to={createPageUrl('Batches')}><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">{batch.batch_number}</h1>
                    <p className="text-slate-500">{batch.course_name || course?.name}</p>
                </div>
                <Badge className={sColors[batch.status] || 'bg-slate-100 text-slate-700'}>{sLabels[batch.status] || batch.status}</Badge>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-[var(--primary-color)] to-[#2d4a6f]" />
                <CardContent className="relative pt-0 pb-5 px-6">
                    <div className="-mt-10 flex flex-col md:flex-row gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-[var(--primary-color)] flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">
                            {batch.batch_number?.match(/\d+/)?.[0] || 'B'}
                        </div>
                        <div className="flex-1 pt-0 md:pt-10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div><p className="text-xs text-slate-500">মোট স্টুডেন্ট</p><p className="text-xl font-bold">{students.length} জন</p></div>
                                {course && <><div><p className="text-xs text-slate-500">কোর্স ফি</p><p className="text-xl font-bold">{course.is_free ? 'ফ্রি' : `৳${course.price}`}</p></div><div><p className="text-xs text-slate-500">মোট ক্লাস</p><p className="text-xl font-bold">{course.total_classes || 0}</p></div></>}
                                {batch.start_date && <div><p className="text-xs text-slate-500">শুরুর তারিখ</p><p className="text-base font-semibold">{new Date(batch.start_date).toLocaleDateString('bn-BD')}</p></div>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {enrollments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => setPaymentFilter('all')}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-emerald-500" /><p className="text-xs text-slate-500">মোট আয়</p></div>
                            <p className="text-xl font-bold text-emerald-600">৳{stats.totalPaid.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => setPaymentFilter('due')}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-red-500" /><p className="text-xs text-slate-500">মোট বাকি</p></div>
                            <p className="text-xl font-bold text-red-600">৳{stats.totalDue.toLocaleString()}</p>
                            <p className="text-xs text-red-400 mt-1">{stats.partialCount + stats.unpaidCount} জনের কাছে</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => setPaymentFilter('paid')}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1"><CheckCheck className="h-4 w-4 text-blue-500" /><p className="text-xs text-slate-500">পেইড</p></div>
                            <p className="text-xl font-bold text-blue-600">{stats.paidCount} জন</p>
                            <p className="text-xs text-slate-400 mt-1">ফ্রি: {stats.freeCount} জন</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => setPaymentFilter('partial')}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1"><Gift className="h-4 w-4 text-amber-500" /><p className="text-xs text-slate-500">আংশিক / বাকি</p></div>
                            <p className="text-xl font-bold text-amber-600">{stats.partialCount} জন</p>
                            <p className="text-xs text-slate-400 mt-1">অপেইড: {stats.unpaidCount} জন</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="students">
                <TabsList className="mb-4">
                    <TabsTrigger value="students"><Users className="h-4 w-4 mr-1" />স্টুডেন্ট ({students.length})</TabsTrigger>
                    <TabsTrigger value="modules"><Layers className="h-4 w-4 mr-1" />মডিউল ({modules.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="students">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-[var(--primary-color)]" />স্টুডেন্ট লিস্ট
                                    <Badge className="bg-slate-100 text-slate-700">{filteredStudents.length}/{students.length}</Badge>
                                </CardTitle>
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input placeholder="নাম, ফোন বা রোল..." value={searchText} onChange={e => setSearchText(e.target.value)} className="pl-9 w-full sm:w-48" />
                                    </div>
                                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                        <SelectTrigger className="w-full sm:w-44">
                                            <Filter className="h-4 w-4 mr-2 text-slate-400" /><SelectValue placeholder="পেমেন্ট ফিল্টার" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সব স্টুডেন্ট</SelectItem>
                                            <SelectItem value="due">⚠️ বাকি আছে</SelectItem>
                                            <SelectItem value="paid">✅ পেইড</SelectItem>
                                            <SelectItem value="partial">🔶 আংশিক পেইড</SelectItem>
                                            <SelectItem value="unpaid">❌ অপেইড</SelectItem>
                                            <SelectItem value="free">🎁 ফ্রি</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
                                            <SelectItem value="active">চলমান</SelectItem>
                                            <SelectItem value="completed">সম্পন্ন</SelectItem>
                                            <SelectItem value="dropped">বাদ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {(searchText || paymentFilter !== 'all' || statusFilter !== 'all') && (
                                        <Button variant="ghost" size="sm" onClick={() => { setSearchText(''); setPaymentFilter('all'); setStatusFilter('all'); }}>রিসেট</Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {students.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 mb-4">এই ব্যাচে এখনো কোনো স্টুডেন্ট নেই</p>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500">এই ফিল্টারে কোনো স্টুডেন্ট পাওয়া যায়নি</p>
                                    <Button variant="ghost" size="sm" onClick={() => { setSearchText(''); setPaymentFilter('all'); setStatusFilter('all'); }} className="mt-2">ফিল্টার রিসেট</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredStudents.map((student) => {
                                        const enrollment = getEnrollment(student.id);
                                        return (
                                            <Card key={student.id} className={`border shadow-sm hover:shadow-md transition-shadow ${enrollment?.due_amount > 0 ? 'border-l-4 border-l-red-400' : ''}`}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        {student.photo_url ? (
                                                            <img src={student.photo_url} alt={student.name} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                                                        ) : (
                                                            <div className="h-14 w-14 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{student.name?.[0] || 'S'}</div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-slate-800 truncate">{student.name}</h3>
                                                            <p className="text-xs text-slate-500">রোল: {student.roll_number}</p>
                                                            {enrollment && (
                                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                                    <Badge className={`text-xs ${pColors[enrollment.payment_status]}`}>{pLabels[enrollment.payment_status]}</Badge>
                                                                    <Badge className={`text-xs ${sColors[enrollment.status]}`}>{sLabels[enrollment.status]}</Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 text-xs text-slate-600 mb-3">
                                                        <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-slate-400" /><span>{student.phone}</span></div>
                                                        {student.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-slate-400" /><span className="truncate">{student.email}</span></div>}
                                                    </div>
                                                    {enrollment && !enrollment.is_free && (
                                                        <div className="bg-slate-50 rounded-lg p-2 mb-3 text-xs">
                                                            <div className="flex justify-between text-emerald-600"><span>পরিশোধিত:</span><span className="font-semibold">৳{(enrollment.amount_paid || 0).toLocaleString()}</span></div>
                                                            {enrollment.due_amount > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>বাকি:</span><span>৳{enrollment.due_amount.toLocaleString()}</span></div>}
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        {enrollment?.due_amount > 0 && (
                                                            <Button size="sm" onClick={() => { setSelectedEnrollment(enrollment); setPaymentDialogOpen(true); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs">
                                                                <CreditCard className="h-3 w-3 mr-1" />৳{enrollment.due_amount.toLocaleString()} বাকি
                                                            </Button>
                                                        )}
                                                        <Link to={createPageUrl(`StudentProfile?id=${student.id}`)} className={enrollment?.due_amount > 0 ? '' : 'flex-1'}>
                                                            <Button variant="outline" size="sm" className="w-full"><Eye className="h-3 w-3 mr-1" />প্রোফাইল</Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="modules">
                    <Card className="border-0 shadow-sm">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-[var(--primary-color)]" />কোর্স মডিউলসমূহ ({modules.length} টি)</CardTitle></CardHeader>
                        <CardContent>
                            {modules.length === 0 ? (
                                <div className="text-center py-12 text-slate-400"><Layers className="h-12 w-12 mx-auto mb-2 opacity-40" /><p>মডিউল যোগ করা হয়নি।</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {modules.map((m) => (
                                        <div key={m.id} className={`p-4 rounded-xl border-l-4 ${m.status === 'completed' ? 'border-emerald-500 bg-emerald-50' : m.status === 'cancelled' ? 'border-red-300 bg-red-50' : 'border-[var(--primary-color)] bg-slate-50'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${m.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-[var(--primary-color)] text-white'}`}>
                                                    {m.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : m.class_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-slate-800">ক্লাস {m.class_number}: {m.title}</p>
                                                        <Badge className={m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                                                            {m.status === 'completed' ? 'সম্পন্ন' : m.status === 'cancelled' ? 'বাতিল' : 'আসন্ন'}
                                                        </Badge>
                                                    </div>
                                                    {m.description && <p className="text-sm text-slate-600 mt-1">{m.description}</p>}
                                                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-slate-500">
                                                        {m.scheduled_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.scheduled_date).toLocaleDateString('bn-BD')}</span>}
                                                        {m.duration_minutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.duration_minutes} মিনিট</span>}
                                                        {m.resource_url && <a href={m.resource_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><LinkIcon className="h-3 w-3" />রিসোর্স</a>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddPaymentDialog
                open={paymentDialogOpen}
                onClose={() => { setPaymentDialogOpen(false); setSelectedEnrollment(null); }}
                enrollment={selectedEnrollment}
                onSuccess={() => { setPaymentDialogOpen(false); setSelectedEnrollment(null); loadData(); }}
            />
        </div>
    );
}