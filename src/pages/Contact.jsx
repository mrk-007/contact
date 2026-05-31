import { useState, useCallback, useEffect, useRef } from 'react';
import {
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  SendRounded,
  CheckCircleRounded,
  ShieldOutlined,
  IntegrationInstructionsOutlined,
  SupportAgentOutlined,
  VerifiedUserOutlined,
  LockOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

/* ─────────────────────────────────────────
   MUI Theme
───────────────────────────────────────── */
const muiTheme = createTheme({
  palette: {
    primary: { main: '#0ea5e9' },
    secondary: { main: '#0d9488' },
    error: { main: '#ef4444' },
  },
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 400,
          color: '#0f172a',
          backgroundColor: '#fff',
          transition: 'transform 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
            transition: 'border-color 0.2s ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0ea5e9',
            borderWidth: '1.5px',
          },
          '&.Mui-focused': { boxShadow: 'none' },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: '#ef4444' },
          '&.Mui-error.Mui-focused': { boxShadow: 'none' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: '#64748b',
          transition: 'color 0.2s ease',
          '&.Mui-focused': { color: '#0ea5e9' },
          '&.Mui-error': { color: '#ef4444' },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
          fontSize: '0.7rem',
          marginLeft: 0,
          marginTop: '4px',
        },
      },
    },
  },
});

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const SERVICE_OPTIONS = [
  { value: 'Accounting Services', label: 'Accounting' },
  { value: 'Tax Services', label: 'Tax' },
  { value: 'IT Services', label: 'IT' },
];

const TRUST_FACTORS = [
  {
    Icon: ShieldOutlined,
    heading: 'SOC 2 Type II Certified',
    body: 'Enterprise-grade data security and compliance baked in from day one.',
  },
  {
    Icon: SupportAgentOutlined,
    heading: 'Dedicated Account Teams',
    body: 'A named specialist handles your account — no ticket queues, no hand-offs.',
  },
  {
    Icon: IntegrationInstructionsOutlined,
    heading: 'Deep ERP & CRM Integrations',
    body: 'Native connectors for SAP, NetSuite, Salesforce, and 40+ enterprise platforms.',
  },
  {
    Icon: TrendingUpOutlined,
    heading: 'Proven at Scale',
    body: 'Trusted by finance and ops teams at companies from Series B to Fortune 500.',
  },
];

const METRICS = [
  { raw: 10000, display: '10k+', label: 'Businesses served' },
  { raw: 2, display: '< 2 hrs', label: 'Median response time' },
  { raw: 99.2, display: '99.2%', label: 'Client retention rate' },
];

const MAX_DESC = 500;
const INITIAL_FORM = { name: '', company: '', email: '', services: [], description: '' };

/* ─────────────────────────────────────────
   Hooks
───────────────────────────────────────── */

/** Fires once when element enters the viewport */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15, ...options }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/** Animated counter that counts up from 0 to target once inView */
function useCounter(target, inView, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return count;
}

/* ─────────────────────────────────────────
   Validation
───────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = 'Full name is required.';
  if (!form.company.trim()) e.company = 'Company name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = 'Enter a valid work email address.';
  if (form.services.length === 0) e.services = 'Select at least one service area.';
  if (form.description.trim().length < 15)
    e.description = 'Please provide at least 15 characters of context.';
  return e;
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
function SectionDivider() {
  return <div className="h-px bg-slate-100 w-full my-1" />;
}

/** Wraps children with a scroll-triggered fade-up reveal */
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Animated metric — counts up on entry */
function AnimatedMetric({ display, raw, label, delay }) {
  const [ref, inView] = useInView();
  // Detect if it's a simple integer we can count
  const isCountable = Number.isInteger(raw) && raw < 1000;
  const count = useCounter(isCountable ? raw : 0, inView, 1200);

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      <span className="text-[1.35rem] font-semibold text-slate-900 tabular-nums leading-none block">
        {isCountable ? `< ${count} hrs` : display}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 leading-none mt-1 block">
        {label}
      </span>
    </div>
  );
}

function ServicePill({ label, value, active, onToggle, delay }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      aria-pressed={active}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border pill-enter',
        'text-[0.8125rem] font-medium select-none cursor-pointer outline-none',
        'focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.03] active:scale-[0.97]',
        active
          ? 'bg-sky-500 border-sky-500 text-white shadow-sm scale-[1.02]'
          : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 hover:shadow-sm',
      ].join(' ')}
    >
      <span
        className="flex items-center justify-center transition-all duration-200"
        style={{ width: active ? '16px' : '0px', overflow: 'hidden', opacity: active ? 1 : 0 }}
      >
        <CheckCircleRounded sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }} />
      </span>
      {label}
    </button>
  );
}

function TrustRow({ Icon, heading, body, delay }) {
  const [ref, inView] = useInView();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className="flex items-start gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : 'translateX(-18px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      <div
        className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center"
        style={{
          backgroundColor: hovered ? 'rgba(14,165,233,0.06)' : '#f8fafc',
          borderColor: hovered ? 'rgba(14,165,233,0.25)' : '#f1f5f9',
          transition: 'background-color 0.25s ease, border-color 0.25s ease, transform 0.25s ease',
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
        }}
      >
        <Icon
          sx={{
            fontSize: 16,
            color: hovered ? '#0ea5e9' : '#94a3b8',
            transition: 'color 0.25s ease',
          }}
        />
      </div>
      <div>
        <p
          className="text-sm font-semibold leading-snug transition-colors duration-200"
          style={{ color: hovered ? '#0f172a' : '#1e293b' }}
        >
          {heading}
        </p>
        <p className="text-xs font-normal text-slate-500 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function SuccessState({ onReset }) {
  return (
    <div
      className="flex flex-col gap-4 py-16 px-2"
      role="status"
      aria-live="polite"
      style={{ animation: 'successReveal 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
    >
      <div
        className="w-8 h-px bg-sky-500"
        style={{ animation: 'expandLine 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
      />
      <div
        className="flex flex-col gap-2"
        style={{ animation: 'fadeUp 0.5s ease 0.25s both' }}
      >
        <p className="text-lg font-semibold text-slate-900 tracking-tight leading-snug">
          Message received.
        </p>
        <p className="text-sm font-normal text-slate-500 leading-relaxed max-w-xs">
          A specialist will review your inquiry and follow up within{' '}
          <span className="font-medium text-slate-700">2 business hours</span>.
          Check your inbox for a confirmation.
        </p>
      </div>
      <button
        onClick={onReset}
        style={{ animation: 'fadeUp 0.5s ease 0.4s both' }}
        className="w-fit text-xs font-medium text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors duration-200 mt-1"
      >
        Submit another inquiry
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', sev: 'success' });
  const [formVisible, setFormVisible] = useState(false);
  const formRef = useRef(null);

  // Trigger form card entry animation on scroll
  useEffect(() => {
    if (!formRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setFormVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(formRef.current);
    return () => obs.disconnect();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > MAX_DESC) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const toggleService = useCallback((val) => {
    setForm((prev) => {
      const next = prev.services.includes(val)
        ? prev.services.filter((s) => s !== val)
        : [...prev.services, val];
      return { ...prev, services: next };
    });
    setErrors((prev) => ({ ...prev, services: '' }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setToast({ open: true, msg: 'Please resolve the highlighted fields.', sev: 'error' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm(INITIAL_FORM);
    }, 1800);
  };

  const handleReset = () => { setSubmitted(false); setErrors({}); };

  const tf = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    error: Boolean(errors[name]),
    helperText: errors[name] || '',
  });

  const descLen = form.description.length;
  const descRatio = descLen / MAX_DESC;

  return (
    <ThemeProvider theme={muiTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* ── Keyframes ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes successReveal {
          from { opacity: 0; transform: translateY(10px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes expandLine {
          from { width: 0px; opacity: 0; }
          to   { width: 32px; opacity: 1; }
        }
        @keyframes pillEnter {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: var(--target-width); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.6); opacity: 0.7; }
        }

        /* ── Utility classes ── */
        .pill-enter {
          animation: pillEnter 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .form-card-enter {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .form-card-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Eyebrow dot pulse ── */
        .eyebrow-dot {
          animation: dotPulse 2.5s ease-in-out infinite;
        }

        /* ── Button shimmer on hover ── */
        .btn-submit {
          position: relative;
          overflow: hidden;
        }
        .btn-submit::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.18) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .btn-submit:not(:disabled):hover::after {
          opacity: 1;
          animation: shimmer 0.7s ease forwards;
        }

        /* ── Field focus lift ── */
        .MuiOutlinedInput-root:focus-within {
          transform: translateY(-1px);
        }

        /* ── Staggered form field reveal ── */
        .field-reveal {
          opacity: 0;
          transform: translateY(12px);
          animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <section
        id="contact"
        aria-label="Contact Us"
        className="relative bg-white min-h-screen scroll-mt-20"
        style={{ scrollBehavior: 'smooth', fontFamily: '"Inter", ui-sans-serif, sans-serif' }}
      >
        <div className="h-px w-full bg-slate-100" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">

            {/* ══════════════════════
                LEFT COLUMN
            ══════════════════════ */}
            <div className="flex flex-col gap-10 lg:sticky lg:top-24">

              {/* Section title + eyebrow */}
              <Reveal delay={0}>
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Contact Us
                  </p>
                  <div className="inline-flex items-center gap-2 w-fit">
                    <div className="eyebrow-dot w-1 h-1 rounded-full bg-sky-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-500">
                      Enterprise Partnerships
                    </span>
                  </div>
                </div>
              </Reveal>

              {/* Headline */}
              <Reveal delay={80}>
                <div className="flex flex-col gap-4">
                  <h2 className="text-[2rem] md:text-[2.5rem] font-semibold text-slate-900 leading-[1.14] tracking-tight">
                    Partner with us to scale your enterprise operations.
                  </h2>
                  <p className="text-base font-normal text-slate-500 leading-relaxed max-w-sm">
                    Accounting, tax, and IT expertise — delivered as a unified service layer for growing enterprises.
                  </p>
                </div>
              </Reveal>

              {/* Metric strip — animated counters */}
              <Reveal delay={160}>
                <div className="flex items-stretch divide-x divide-slate-100 w-fit">
                  {METRICS.map(({ raw, display, label }, i) => (
                    <div
                      key={label}
                      className={i === 0 ? 'pr-7' : i === METRICS.length - 1 ? 'pl-7' : 'px-7'}
                    >
                      <AnimatedMetric
                        display={display}
                        raw={raw}
                        label={label}
                        delay={i * 120}
                      />
                    </div>
                  ))}
                </div>
              </Reveal>

              <div className="h-px bg-slate-100 w-full" />

              {/* Trust checklist */}
              <div className="flex flex-col gap-6">
                <Reveal delay={0}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Why enterprise teams choose us
                  </p>
                </Reveal>
                {TRUST_FACTORS.map((t, i) => (
                  <TrustRow key={t.heading} {...t} delay={i * 90} />
                ))}
              </div>

              {/* Compliance footnote */}
              <Reveal delay={0}>
                <div className="flex items-start gap-2 pt-1">
                  <LockOutlined sx={{ fontSize: 12, color: '#94a3b8', mt: '2px', flexShrink: 0 }} />
                  <span className="text-[11px] font-normal text-slate-400 leading-relaxed">
                    All submissions are encrypted in transit and at rest.
                    We never sell or share your data.
                  </span>
                </div>
              </Reveal>
            </div>

            {/* ══════════════════════
                RIGHT COLUMN — Form
            ══════════════════════ */}
            <div
              ref={formRef}
              className={`form-card-enter w-full rounded-2xl border border-slate-100 bg-white shadow-[0_2px_24px_rgba(15,23,42,0.06)] overflow-hidden${formVisible ? ' visible' : ''}`}
              style={{ transitionDelay: '120ms' }}
            >
              <div className="p-8 md:p-10">
                {submitted ? (
                  <SuccessState onReset={handleReset} />
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Enterprise contact form"
                    className="flex flex-col gap-5"
                  >
                    {/* Form header */}
                    <div
                      className="mb-1 field-reveal"
                      style={{ animationDelay: formVisible ? '180ms' : '9999ms' }}
                    >
                      <p className="text-[1rem] font-semibold text-slate-900 tracking-tight">
                        Get in touch
                      </p>
                      <p className="text-xs font-normal text-slate-400 mt-0.5">
                        Fill in the form and a specialist will respond within 2 business hours.
                      </p>
                    </div>

                    <SectionDivider />

                    {/* Name + Company */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 field-reveal"
                      style={{ animationDelay: formVisible ? '240ms' : '9999ms' }}
                    >
                      <TextField
                        {...tf('name')}
                        id="cf-name"
                        label="Full Name"
                        placeholder="Jane Smith"
                        autoComplete="name"
                        inputProps={{ 'aria-label': 'Full Name' }}
                      />
                      <TextField
                        {...tf('company')}
                        id="cf-company"
                        label="Company Name"
                        placeholder="Acme Corp"
                        autoComplete="organization"
                        inputProps={{ 'aria-label': 'Company Name' }}
                      />
                    </div>

                    {/* Work email */}
                    <div
                      className="field-reveal"
                      style={{ animationDelay: formVisible ? '300ms' : '9999ms' }}
                    >
                      <TextField
                        {...tf('email')}
                        id="cf-email"
                        label="Work Email"
                        type="email"
                        placeholder="jane@acmecorp.com"
                        autoComplete="email"
                        inputProps={{ 'aria-label': 'Work Email' }}
                      />
                    </div>

                    {/* Service pill selector */}
                    <div
                      className="flex flex-col gap-2 field-reveal"
                      style={{ animationDelay: formVisible ? '360ms' : '9999ms' }}
                    >
                      <label className="text-[0.8125rem] font-medium text-slate-500">
                        Service Area
                        <span className="ml-1.5 text-slate-300 font-normal text-xs">
                          (multi-select)
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SERVICE_OPTIONS.map(({ value, label }, i) => (
                          <ServicePill
                            key={value}
                            value={value}
                            label={label}
                            active={form.services.includes(value)}
                            onToggle={toggleService}
                            delay={i * 60}
                          />
                        ))}
                      </div>
                      {errors.services && (
                        <p
                          className="text-[0.7rem] text-red-500 mt-0.5"
                          role="alert"
                          style={{ animation: 'fadeUp 0.25s ease both' }}
                        >
                          {errors.services}
                        </p>
                      )}
                    </div>

                    {/* Description + char counter */}
                    <div
                      className="flex flex-col field-reveal"
                      style={{ animationDelay: formVisible ? '420ms' : '9999ms' }}
                    >
                      <TextField
                        {...tf('description')}
                        id="cf-description"
                        label="Project Description"
                        placeholder="Describe your project scope, goals, team size, and timeline…"
                        multiline
                        minRows={4}
                        maxRows={8}
                        inputProps={{
                          'aria-label': 'Project Description',
                          maxLength: MAX_DESC,
                        }}
                        helperText={errors.description || ''}
                      />
                      {/* Progress bar + counter */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${descRatio * 100}%`,
                              backgroundColor:
                                descRatio >= 1 ? '#ef4444' : descRatio >= 0.85 ? '#f59e0b' : '#0ea5e9',
                            }}
                          />
                        </div>
                        <span
                          className="tabular-nums text-[10px] font-medium transition-colors duration-200 flex-shrink-0"
                          style={{
                            color:
                              descRatio >= 1 ? '#ef4444' : descRatio >= 0.85 ? '#f59e0b' : '#94a3b8',
                          }}
                        >
                          {descLen} / {MAX_DESC}
                        </span>
                      </div>
                    </div>

                    <SectionDivider />

                    {/* Submit */}
                    <div
                      className="field-reveal"
                      style={{ animationDelay: formVisible ? '480ms' : '9999ms' }}
                    >
                      <button
                        type="submit"
                        disabled={loading}
                        className={[
                          'btn-submit w-full flex items-center justify-center gap-2.5',
                          'py-3 px-6 rounded-lg text-sm font-semibold text-white',
                          'bg-sky-500 border border-sky-500',
                          'transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2',
                          loading
                            ? 'opacity-70 cursor-not-allowed'
                            : 'hover:bg-sky-600 hover:border-sky-600 hover:shadow-lg hover:shadow-sky-100 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.988]',
                        ].join(' ')}
                      >
                        {loading ? (
                          <>
                            <CircularProgress size={14} sx={{ color: '#fff' }} />
                            <span>Sending…</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <SendRounded
                              sx={{
                                fontSize: 15,
                                transition: 'transform 0.2s ease',
                              }}
                              className="group-hover:translate-x-1"
                            />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Trust footnote */}
                    <div
                      className="field-reveal"
                      style={{ animationDelay: formVisible ? '540ms' : '9999ms' }}
                    >
                      <p className="text-center text-[11px] font-normal text-slate-400 -mt-1">
                        <VerifiedUserOutlined
                          sx={{ fontSize: 11, mr: 0.5, verticalAlign: 'middle', color: '#94a3b8' }}
                        />
                        Encrypted &amp; confidential. No spam, ever.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="h-px w-full bg-slate-100" />
      </section>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.sev}
          variant="filled"
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          sx={{
            fontFamily: '"Inter", ui-sans-serif, sans-serif',
            fontWeight: 500,
            fontSize: '0.8125rem',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}