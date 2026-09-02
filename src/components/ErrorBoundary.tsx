import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 mx-auto max-w-2xl cns-glass-card rounded-2xl border border-rose-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-950/70 border border-rose-500/50 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || 'Đã xảy ra sự cố khi hiển thị mục này'}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Hệ thống đã tự động bảo vệ dữ liệu của bạn và ngăn ngừa gián đoạn ứng dụng.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-[#050c1e] rounded-xl border border-[#1e3c7a] text-left text-[11px] font-mono text-rose-300 max-h-32 overflow-y-auto">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại giao diện</span>
            </button>
            <button
              onClick={this.handleHardReload}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0a183d] hover:bg-[#12285a] text-slate-200 rounded-xl text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
