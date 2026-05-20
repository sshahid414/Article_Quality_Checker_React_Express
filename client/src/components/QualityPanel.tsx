import type { QualityCheck } from '../types';

interface Props {
  checks: QualityCheck[];
  canUpload: boolean;
}

const badgeClass = 'rounded-full px-2.5 py-1 text-xs font-semibold';

export function QualityPanel({ checks, canUpload }: Props) {
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  return (
    <section className="w-full rounded-xl border border-border bg-surface px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[1.05rem] font-semibold">Quality Checks</h2>
        <div className="flex gap-2">
          <span className={`${badgeClass} bg-pass-bg text-pass`}>{passCount} pass</span>
          <span className={`${badgeClass} bg-warn-bg text-warn`}>{warnCount} warn</span>
          <span className={`${badgeClass} bg-fail-bg text-fail`}>{failCount} fail</span>
        </div>
      </div>

      <div
        className={`mb-4 rounded-md px-4 py-3 text-sm font-semibold ${canUpload
          ? 'border border-pass/25 bg-pass-bg text-pass'
          : 'border border-fail/25 bg-fail-bg text-fail'
          }`}
      >
        {canUpload
          ? 'Article passed all required checks — ready to upload'
          : 'Fix failing checks before uploading'}
      </div>

      <div className="grid grid-cols-3 max-[1268px]:grid-cols-2 max-[680px]:grid-cols-1 gap-2.5">
        {checks.map((check) => (
          <div
            key={check.id + check.label}
            className={`flex gap-3 rounded-md border border-border bg-surface-2 px-4 py-3 border-l-[3px] ${check.status === 'pass'
              ? 'border-l-pass'
              : check.status === 'warn'
                ? 'border-l-warn'
                : 'border-l-fail'
              }`}
          >
            <span
              className={`w-5 shrink-0 text-base font-bold ${check.status === 'pass'
                ? 'text-pass'
                : check.status === 'warn'
                  ? 'text-warn'
                  : 'text-fail'
                }`}
            >
              {check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗'}
            </span>
            <div>
              <strong>{check.label}</strong>
              <p className="mt-0.5 text-sm text-text-muted">{check.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
