import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full border border-rose-100">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <AlertTriangle size={32} />
              <h1 className="text-2xl font-bold font-display">Đã có lỗi xảy ra!</h1>
            </div>
            <p className="text-slate-600 mb-6 font-medium">
              Ứng dụng vừa gặp phải một lỗi không mong muốn. Dưới đây là chi tiết kỹ thuật:
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Thông báo lỗi:</h3>
              <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Component Stack:</h3>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
