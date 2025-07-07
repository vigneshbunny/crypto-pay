import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";
import type { Transaction } from "@/types/wallet";
import { ReactNode } from "react";

interface TransactionItemProps {
  transaction: Transaction;
  statusIcon?: ReactNode;
  statusText?: string;
}

export default function TransactionItem({ transaction, statusIcon, statusText }: TransactionItemProps) {
  const isReceive = transaction.type === 'receive';
  const isPending = transaction.status === 'pending';
  
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed': return isReceive ? 'text-green-500' : 'text-red-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    if (statusText) return statusText;
    if (transaction.status === 'pending' && transaction.confirmations > 0) {
      return `Processing (${transaction.confirmations}/19 confirmations)`;
    }
    if (transaction.status === 'confirmed') {
      return 'Completed';
    }
    if (transaction.status === 'failed') {
      return 'Failed';
    }
    return transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today • ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday • ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) + ` • ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Card className={isPending ? "border-yellow-100 bg-yellow-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              isPending 
                ? 'bg-yellow-100' 
                : isReceive 
                  ? 'bg-green-50' 
                  : 'bg-red-50'
            }`}>
              {statusIcon || (isPending ? (
                <Clock className="text-yellow-500" size={16} />
              ) : isReceive ? (
                <ArrowDown className="text-green-500" size={16} />
              ) : (
                <ArrowUp className="text-red-500" size={16} />
              ))}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {isPending ? 'Sending' : isReceive ? 'Received' : 'Sent'} {transaction.tokenType}
              </p>
              <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${getStatusColor()}`}>
              {isReceive ? '+' : '-'}
              {parseFloat(transaction.amount).toFixed(6)} {transaction.tokenType}
            </p>
            <p className={`text-xs ${isPending ? 'text-yellow-600' : 'text-gray-500'}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>{isReceive ? 'From:' : 'To:'}</span>
            <span className="font-mono">
              {formatAddress(isReceive ? transaction.fromAddress : transaction.toAddress)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Transaction ID:</span>
            <span className="font-mono">
              {formatAddress(transaction.txHash)}
            </span>
          </div>
          {transaction.gasUsed && (
            <div className="flex justify-between">
              <span>Network Fee:</span>
              <span>{parseFloat(transaction.gasUsed).toFixed(2)} TRX</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
