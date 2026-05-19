import { useState, useRef } from 'react';
import { uploadResume, downloadResume, updateSkills } from '../../services/applicationService';
import { Button } from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import ResumeParserSection from '../../components/ResumeParserSection';
import { Upload, Download, Eye, FileText, CheckCircle, Sparkles, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function ResumeUploadPage() {
  const { user, updateUser } = useAuth();
  const [file, setFile]                 = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [viewing, setViewing]           = useState(false);
  const fileRef = useRef();

  // Skills state — pre-fill from AuthContext
  const [skills, setSkills]         = useState(user?.skills || '');
  const [savingSkills, setSaving]   = useState(false);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return toast.error('Select a PDF file first');
    if (file.type !== 'application/pdf') return toast.error('Only PDF files allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5 MB');
    setUploading(true);
    try {
      const res = await uploadResume(file);
      toast.success('Resume uploaded — skills auto-extracted!');
      // Sync both resumeUrl and auto-parsed skills into AuthContext
      const updated = { ...user };
      if (res.data?.resumeUrl) updated.resumeUrl = res.data.resumeUrl;
      if (res.data?.skills) {
        updated.skills = res.data.skills;
        setSkills(res.data.skills); // update textarea immediately
      }
      updateUser(updated);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Download ─────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadResume();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.pdf'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } catch {
      toast.error('No resume on file or download failed');
    } finally {
      setDownloading(false);
    }
  };

  // ── View inline ──────────────────────────────────────────────────────────────
  const handleView = async () => {
    setViewing(true);
    try {
      const res = await downloadResume();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const tab  = window.open(url, '_blank');
      if (!tab) toast.error('Pop-ups blocked — please allow pop-ups and try again');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error('Could not load resume. Try downloading instead.');
    } finally {
      setViewing(false);
    }
  };

  // ── Save Skills ──────────────────────────────────────────────────────────────
  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      const res = await updateSkills(skills);
      updateUser({ ...user, skills: res.data?.skills ?? skills });
      toast.success('Skills saved! Recommendations will update.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save skills');
    } finally {
      setSaving(false);
    }
  };

  // ── Callback when parser merges skills ────────────────────────────────────
  const handleSkillsMerged = (mergedSkills) => {
    setSkills(mergedSkills);
  };

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="Resume & Skills" subtitle="Upload your resume and list your skills to get personalised job recommendations" />

      {/* Current resume status */}
      {user?.resumeUrl ? (
        <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Resume on file</p>
              <p className="text-xs text-green-500">Ready to use for job applications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xs" loading={viewing} onClick={handleView}>
              <Eye size={13} /> View
            </Button>
            <Button variant="secondary" size="xs" loading={downloading} onClick={handleDownload}>
              <Download size={13} /> Download
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          No resume uploaded yet. Upload a PDF resume to start applying.
        </div>
      )}

      {/* Upload box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          {user?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}
        </h2>

        {/* File picker area */}
        <div
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <FileText size={28} className={file ? 'text-blue-500' : 'text-slate-400'} />
          {file ? (
            <>
              <p className="text-sm font-medium text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
              <button
                type="button"
                className="text-xs text-red-500 hover:underline mt-1"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">Click to select PDF file</p>
              <p className="text-xs text-slate-400">PDF only · Max 5 MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* Upload button */}
        <div className="mt-4">
          <Button
            variant="primary"
            size="md"
            loading={uploading}
            onClick={handleUpload}
            disabled={!file}
            className="w-full"
          >
            <Upload size={15} />
            {uploading ? 'Uploading...' : 'Upload Resume'}
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium mb-1">Tips for your resume:</p>
          <ul className="text-xs text-slate-400 space-y-0.5">
            <li>• Keep it to 1–2 pages</li>
            <li>• Include CGPA, branch, skills, and projects</li>
            <li>• Use a clean, readable format</li>
          </ul>
        </div>
      </div>

      {/* ── AI Resume Parser ──────────────────────────────────────────────── */}
      {user?.resumeUrl && (
        <ResumeParserSection
          currentSkills={skills}
          onSkillsUpdated={handleSkillsMerged}
        />
      )}

      {/* ── Skills card ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={15} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-700">Your Skills</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Enter your skills separated by commas. These are used to recommend matching jobs on your dashboard.
        </p>

        <textarea
          id="skills-input"
          rows={3}
          placeholder="e.g.  Java, Spring Boot, React, SQL, REST API, Git"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition"
        />

        {/* Chip preview */}
        {skills.trim() && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="primary"
            size="md"
            loading={savingSkills}
            onClick={handleSaveSkills}
            className="w-full"
          >
            <Save size={14} />
            {savingSkills ? 'Saving...' : 'Save Skills'}
          </Button>
        </div>
      </div>
    </div>
  );
}
