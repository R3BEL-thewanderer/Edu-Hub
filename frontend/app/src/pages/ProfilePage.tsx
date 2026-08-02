import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Book, Save, Clock, GraduationCap, ChevronDown, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSubjectById, sem1Subjects, sem2Subjects } from '@/data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Combine all subjects for the dropdown
const allSubjects = [...sem1Subjects, ...sem2Subjects];

export function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuthStore();

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Analytics Form State
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studyHours, setStudyHours] = useState('');

  // UI State
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);

  // Initialize state when user loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBranch(user.branch || '');
      setDivision(user.division || '');
      setRollNumber(user.rollNumber || '');
      setStudentId(user.studentId || '');
      setCollege(user.college || 'TCET');
      setPhone(user.phone || '');
      setBio(user.bio || '');
    }
  }, [user]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);

    // Default division to 'A' if none provided
    const finalDivision = division.trim() === '' ? 'A' : division;
    setDivision(finalDivision);

    const { error } = await updateProfile({
      // Save under custom_display_name so Google OAuth re-login
      // doesn't overwrite it by refreshing full_name from Google
      custom_display_name: displayName,
      branch,
      division: finalDivision,
      rollNumber,
      studentId,
      college,
      phone,
      bio
    });

    setIsSavingProfile(false);
    if (!error) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      alert(`Error saving profile: ${error}`);
    }
  };

  // Handle Log Study Hours
  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !studyHours) return;

    setIsSavingHours(true);
    
    // Get existing analytics
    const existingAnalytics = user.studyAnalytics || {};
    const currentHours = existingAnalytics[selectedSubject] || 0;
    const addedHours = parseFloat(studyHours);

    const newAnalytics = {
      ...existingAnalytics,
      [selectedSubject]: currentHours + addedHours
    };

    const { error } = await updateProfile({
      studyAnalytics: newAnalytics
    });

    setIsSavingHours(false);
    if (!error) {
      setSelectedSubject('');
      setStudyHours('');
    } else {
      alert(`Error saving study hours: ${error}`);
    }
  };

  // Prepare chart data
  const chartData = Object.entries(user.studyAnalytics || {})
    .map(([subjectId, hours]) => {
      const subject = getSubjectById(subjectId);
      return {
        name: subject ? subject.name : subjectId,
        hours: hours,
        fullName: subject ? subject.fullName : subjectId,
      };
    })
    .sort((a, b) => b.hours - a.hours); // Sort by highest hours

  const totalHours = Object.values(user.studyAnalytics || {}).reduce((sum, h) => sum + h, 0);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-8 rounded-3xl border border-border shadow-sm">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold font-display shadow-lg flex-shrink-0">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold font-display text-primary mb-2">
              {user.displayName || 'Student'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {user.email}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border border-border">
                <GraduationCap className="w-4 h-4" />
                {user.branch || 'Branch Not Set'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-light/50 text-sage text-sm font-medium border border-sage-light">
                Div {user.division || 'A'}
              </span>
              {user.rollNumber && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-light/50 text-sky text-sm font-medium border border-sky-light">
                  Roll: {user.rollNumber}
                </span>
              )}
            </div>
          </div>
          <div className="text-center md:text-right bg-secondary p-4 rounded-2xl border border-border w-full md:w-auto">
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Study Time</p>
            <p className="text-3xl font-bold font-display text-primary flex items-baseline justify-center md:justify-end gap-1">
              {totalHours} <span className="text-base text-muted-foreground font-medium">hrs</span>
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Edit Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-white rounded-3xl border border-border p-8 shadow-sm h-fit"
          >
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-primary">Edit Details</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-semibold">Full Name</Label>
                <Input 
                  id="displayName" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="bg-secondary/50 border-border focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-semibold">Branch (Class)</Label>
                <Input 
                  id="branch" 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. IT, Comps, EXTC"
                  className="bg-secondary/50 border-border focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="division" className="text-sm font-semibold">Division</Label>
                <Input 
                  id="division" 
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="e.g. A, B (Defaults to A)"
                  className="bg-secondary/50 border-border focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNumber" className="text-sm font-semibold">Roll Number</Label>
                <Input 
                  id="rollNumber" 
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 61"
                  className="bg-secondary/50 border-border focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-semibold">Student ID (UID)</Label>
                <Input 
                  id="studentId" 
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 25-ITC61-29"
                  className="bg-secondary/50 border-border focus:bg-white uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college" className="text-sm font-semibold">College</Label>
                <Input 
                  id="college" 
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. TCET"
                  className="bg-secondary/50 border-border focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="bg-secondary/50 border-border focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold">Bio</Label>
                <textarea 
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short bio about yourself..."
                  className="w-full min-h-[80px] p-3 text-sm bg-secondary/50 border border-border focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSavingProfile}
                  className={`w-full font-semibold rounded-xl py-6 transition-all ${
                    profileSuccess ? 'bg-sage hover:bg-sage text-white' : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  {isSavingProfile ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : profileSuccess ? (
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Saved Successfully</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Right Column: Analytics & Logging */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Analytics Chart */}
            <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold font-display text-primary">Study Analytics</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                  Hours per Subject
                </div>
              </div>

              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6a6a7a', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6a6a7a', fontSize: 12 }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1a1a2e' : '#a8c5a0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
                    <Clock className="w-8 h-8 mb-3 opacity-50" />
                    <p className="font-medium">No study hours logged yet</p>
                    <p className="text-sm opacity-70">Log your hours below to see analytics</p>
                  </div>
                )}
              </div>
            </div>

            {/* Log Study Hours Form */}
            <div className="bg-primary rounded-3xl p-8 shadow-md text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-sage" />
                  <h2 className="text-xl font-bold font-display text-white">Log Study Session</h2>
                </div>

                <form onSubmit={handleLogHours} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="subject" className="text-sm font-medium text-white/80">Subject</Label>
                    <div className="relative">
                      <select
                        id="subject"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full h-11 bg-white/10 border border-white/20 rounded-xl px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                        required
                      >
                        <option value="" disabled className="text-black">Select a subject...</option>
                        {allSubjects.map(subject => (
                          <option key={subject.id} value={subject.id} className="text-black">
                            {subject.name} - {subject.year} ({subject.semester === 'sem1' ? 'Sem 1' : 'Sem 2'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2 w-full sm:w-32">
                    <Label htmlFor="hours" className="text-sm font-medium text-white/80">Hours</Label>
                    <Input 
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={studyHours}
                      onChange={(e) => setStudyHours(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 rounded-xl focus:border-sage focus:ring-sage"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSavingHours || !selectedSubject || !studyHours}
                    className="w-full sm:w-auto h-11 bg-sage hover:bg-sage-light text-primary font-bold px-8 rounded-xl transition-all"
                  >
                    {isSavingHours ? 'Saving...' : 'Log Hours'}
                  </Button>
                </form>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
