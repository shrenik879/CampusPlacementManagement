import { useState } from 'react';
import { parseResume, updateSkills } from '../services/applicationService';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { Cpu, Plus, Check, AlertTriangle, Mail, Phone, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumeParserSection({ currentSkills, onSkillsUpdated }) {
  const { user, updateUser } = useAuth();
  const [parsed, setParsed]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [merging, setMerging]     = useState(false);
  const [hasParsed, setHasParsed] = useState(false);

  const handleParse = async () => {
    setLoading(true);
    try {
      const res = await parseResume();
      setParsed(res.data);
      setHasParsed(true);
      toast.success(`Extracted ${res.data.skills?.length || 0} skills from your resume`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeSkills = async () => {
    if (!parsed?.skills?.length) return;

    setMerging(true);
    try {
      // Merge parsed skills with current skills
      const currentSet = new Set(
        (currentSkills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      );
      const parsedLower = parsed.skills.map(s => s.toLowerCase());
      parsedLower.forEach(s => currentSet.add(s));

      const mergedString = [...currentSet].sort().join(', ');
      const res = await updateSkills(mergedString);
      updateUser({ ...user, skills: res.data?.skills ?? mergedString });

      if (onSkillsUpdated) onSkillsUpdated(mergedString);
      toast.success('Skills merged successfully! Recommendations will update.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to merge skills');
    } finally {
      setMerging(false);
    }
  };

  // Compute new vs existing
  const existingSet = new Set(
    (currentSkills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  );
  const newSkills = parsed?.skills?.filter(s => !existingSet.has(s.toLowerCase())) || [];
  const existingSkills = parsed?.skills?.filter(s => existingSet.has(s.toLowerCase())) || [];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Cpu size={15} className="text-purple-500" />
        <h2 className="text-sm font-semibold text-slate-700">AI Resume Parser</h2>
        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium border border-purple-100">
          Smart Extract
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Automatically extract skills, contact info, and education keywords from your uploaded resume.
      </p>

      {!hasParsed ? (
        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={handleParse}
          className="w-full"
          disabled={!user?.resumeUrl}
        >
          <Cpu size={14} />
          {loading ? 'Analyzing Resume...' : 'Analyze My Resume'}
        </Button>
      ) : parsed ? (
        <div className="space-y-4">
          {/* Contact Info */}
          {(parsed.email || parsed.phone) && (
            <div className="flex flex-wrap gap-3">
              {parsed.email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md">
                  <Mail size={11} className="text-slate-400" />
                  {parsed.email}
                </div>
              )}
              {parsed.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md">
                  <Phone size={11} className="text-slate-400" />
                  {parsed.phone}
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {parsed.educationKeywords?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap size={12} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Education</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.educationKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {parsed.skills?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">
                  Extracted Skills ({parsed.skills.length})
                </span>
                {newSkills.length > 0 && (
                  <span className="text-[10px] text-green-600 font-medium">
                    {newSkills.length} new skill{newSkills.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.skills.map((skill, i) => {
                  const isNew = !existingSet.has(skill.toLowerCase());
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        isNew
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isNew ? <Plus size={9} /> : <Check size={9} />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {parsed.skills?.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <AlertTriangle size={13} />
              No skills detected. Try ensuring your resume has a clear "Skills" section.
            </div>
          )}

          {/* Merge button */}
          {newSkills.length > 0 && (
            <Button
              variant="primary"
              size="md"
              loading={merging}
              onClick={handleMergeSkills}
              className="w-full"
            >
              <Plus size={14} />
              {merging ? 'Merging...' : `Add ${newSkills.length} New Skill${newSkills.length !== 1 ? 's' : ''} to My Profile`}
            </Button>
          )}

          {newSkills.length === 0 && existingSkills.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <Check size={13} />
              All extracted skills are already in your profile. You're up to date!
            </div>
          )}

          {/* Re-analyze */}
          <button
            onClick={handleParse}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors"
          >
            Re-analyze resume
          </button>
        </div>
      ) : null}
    </div>
  );
}
