package com.example.demo.dtos;

import java.util.List;

public class CompletedTransactionResponseDTO {
    private boolean hasCompletedTransaction;
    private List<Long> transactionIds;

    public CompletedTransactionResponseDTO(boolean hasCompletedTransaction, List<Long> transactionIds) {
        this.hasCompletedTransaction = hasCompletedTransaction;
        this.transactionIds = transactionIds;
    }

    public boolean isHasCompletedTransaction() {
        return hasCompletedTransaction;
    }

    public void setHasCompletedTransaction(boolean hasCompletedTransaction) {
        this.hasCompletedTransaction = hasCompletedTransaction;
    }

    public List<Long> getTransactionIds() {
        return transactionIds;
    }

    public void setTransactionIds(List<Long> transactionIds) {
        this.transactionIds = transactionIds;
    }
}
