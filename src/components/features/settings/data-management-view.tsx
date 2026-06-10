'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button, Card, PageContainer } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import type { DataCounts } from '@/types';
import { DataRecordsView } from './data-records-view';

type DomainKey = 'budget' | 'asset';

interface DeleteDomain {
  key: DomainKey;
  label: string;
  description: string;
}

const DELETE_DOMAINS: DeleteDomain[] = [
  { key: 'budget', label: '가계부', description: '수입·지출 거래와 카테고리' },
  { key: 'asset', label: '자산', description: '계좌·보유 종목·스냅샷' },
];

function domainSummary(counts: DataCounts, key: DomainKey) {
  if (key === 'budget') {
    return {
      value: counts.budget.transactions,
      unit: '거래',
      breakdown: `카테고리 ${counts.budget.categories} · 반복 ${counts.budget.templates}`,
    };
  }
  return {
    value: counts.asset.snapshots,
    unit: '스냅샷',
    breakdown: `계좌 ${counts.asset.accounts} · 보유 ${counts.asset.holdings} · 현금 ${counts.asset.cashSnapshots}`,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

export function DataManagementView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [counts, setCounts] = useState<DataCounts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadNote, setLoadNote] = useState<string | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<DomainKey | null>(null);
  const [deleteNote, setDeleteNote] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      setCounts(await apiClient.settingsData.getCounts());
    } catch (error) {
      console.error('Failed to load data counts:', error);
    }
  }, []);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0] ?? null;
    if (picked) {
      setFile(picked);
      setLoadNote(null);
    }
  };

  const handleLoad = async () => {
    if (!file) return;
    setIsLoading(true);
    setLoadNote(null);
    try {
      const { before, after } = await apiClient.settingsData.load(file);
      setCounts(after);
      const addedTransactions = after.budget.transactions - before.budget.transactions;
      const addedSnapshots = after.asset.snapshots - before.asset.snapshots;
      setLoadNote(`로드 완료 · 가계부 거래 +${addedTransactions} · 자산 스냅샷 +${addedSnapshots}`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setDataVersion(v => v + 1);
    } catch (error) {
      setLoadNote(`로드 실패: ${errorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (domain: DeleteDomain) => {
    if (!window.confirm(`${domain.label} 데이터를 모두 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeletingDomain(domain.key);
    setDeleteNote(null);
    try {
      setCounts(await apiClient.settingsData.deleteDomain(domain.key));
      setDeleteNote(`${domain.label} 데이터를 삭제했습니다.`);
      setDataVersion(v => v + 1);
    } catch (error) {
      setDeleteNote(`${domain.label} 삭제 실패: ${errorMessage(error)}`);
    } finally {
      setDeletingDomain(null);
    }
  };

  return (
    <PageContainer>
      <section className="mb-8">
        <p className="text-xs font-semibold tracking-wider text-ink-subtle uppercase">설정</p>
        <h2 className="mt-1.5 text-xl font-semibold text-ink">데이터 관리</h2>
        <p className="mt-2 text-sm text-ink-subtle">
          상세 데이터를 화면에서 직접 로드하고 도메인별로 삭제합니다.
        </p>
      </section>

      <div className="grid gap-6">
        {/* 데이터 로드 */}
        <Card>
          <div className="mb-1 flex items-center gap-2">
            <Upload size={18} className="text-accent" />
            <h3 className="text-base font-semibold text-ink">데이터 로드</h3>
          </div>
          <p className="mb-5 text-sm text-ink-subtle">
            xlsx 파일을 업로드해 상세 데이터를 로드합니다. (기존 데이터에 추가됩니다)
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? 'border-accent bg-surface-soft'
                : 'border-hairline-strong bg-surface-soft hover:border-accent'
            }`}
          >
            <Upload size={22} className="text-ink-subtle" />
            <p className="text-sm font-medium text-ink">파일을 선택하거나 여기로 끌어다 놓으세요</p>
            <p className="text-xs text-ink-subtle">.xlsx 형식의 자산·가계부 데이터 파일</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {file && (
            <p className="mt-3 text-sm text-ink-muted">
              선택됨: <span className="font-medium text-ink">{file.name}</span>
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-subtle">
              {loadNote ?? '로드 결과는 로드 후 이 영역에 표시됩니다.'}
            </p>
            <Button variant="primary" disabled={!file || isLoading} onClick={handleLoad}>
              {isLoading ? '로드 중…' : '로드'}
            </Button>
          </div>
        </Card>

        {/* 데이터 삭제 */}
        <Card>
          <div className="mb-1 flex items-center gap-2">
            <Trash2 size={18} className="text-loss" />
            <h3 className="text-base font-semibold text-ink">데이터 삭제</h3>
          </div>
          <p className="mb-5 text-sm text-ink-subtle">도메인을 선택해 해당 데이터를 삭제합니다.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {DELETE_DOMAINS.map(domain => {
              const summary = counts ? domainSummary(counts, domain.key) : null;
              const isDeleting = deletingDomain === domain.key;
              return (
                <div
                  key={domain.key}
                  className="rounded-lg border border-hairline bg-surface-soft p-5"
                >
                  <p className="text-sm font-semibold text-ink">{domain.label}</p>
                  <p className="mt-1 text-xs text-ink-subtle">{domain.description}</p>
                  <p className="mt-3 text-2xl font-bold text-ink">
                    {summary ? summary.value.toLocaleString() : '—'}
                    <span className="ml-1 text-sm font-medium text-ink-subtle">
                      {summary?.unit ?? '건'}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">{summary?.breakdown ?? ' '}</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-loss"
                      disabled={isDeleting}
                      onClick={() => handleDelete(domain)}
                    >
                      {isDeleting ? '삭제 중…' : '삭제'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {deleteNote && <p className="mt-4 text-xs text-ink-subtle">{deleteNote}</p>}
        </Card>

        <DataRecordsView reloadSignal={dataVersion} />
      </div>
    </PageContainer>
  );
}
