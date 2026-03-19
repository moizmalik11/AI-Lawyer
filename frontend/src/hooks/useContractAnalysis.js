import { useState } from 'react';
import { toast } from 'sonner';
import { contractService } from '../services/contract.service';
import { audioNotification } from '../services/audioNotification';

export const useContractAnalysis = () => {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleFile = (selectedFile) => {
        const validMimeTypes = ['application/pdf', 'text/plain'];
        const fileName = selectedFile.name?.toLowerCase() || '';
        const hasValidExtension = fileName.endsWith('.pdf') || fileName.endsWith('.txt');
        const hasValidMimeType = validMimeTypes.includes(selectedFile.type);

        // Some browsers/drags can provide empty or inconsistent MIME types, so allow known extensions too.
        if (!hasValidMimeType && !hasValidExtension) {
            setError('Please upload a valid PDF or TXT file.');
            toast.error('Please upload a valid PDF or TXT file.');
            audioNotification.play('error');
            return false;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size exceeds 10MB limit.');
            toast.error('File size exceeds 10MB limit.');
            audioNotification.play('error');
            return false;
        }

        setFile(selectedFile);
        setAnalysis(null);
        setError(null);
        audioNotification.play('success');
        return true;
    };

    const removeFile = () => {
        setFile(null);
        setAnalysis(null);
        setError(null);
        setProgress(0);
    };

    const analyzeContract = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setAnalysis(null);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 500);

        try {
            const data = await contractService.analyzeContract(file);
            clearInterval(progressInterval);
            setProgress(100);
            
            setTimeout(() => {
                setAnalysis(data.analysis);
                setLoading(false);
                toast.success('Contract analyzed successfully!');
                audioNotification.play('success');
            }, 500);

        } catch (err) {
            clearInterval(progressInterval);
            console.error('Contract analysis failed:', err);
            const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'An error occurred during verification.';
            setError(errorMessage);
            toast.error(errorMessage);
            setLoading(false);
            audioNotification.play('error');
        }
    };

    return {
        file,
        analysis,
        loading,
        error,
        progress,
        handleFile,
        removeFile,
        analyzeContract
    };
};