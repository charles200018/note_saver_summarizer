"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Tesseract from "tesseract.js";
import { useRouter } from "next/navigation";

export default function ImageToTextClient() {
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setImage(imageData);
      setIsProcessing(true);
      setProgress(0);
      setExtractedText("");
      
      try {
        const result = await Tesseract.recognize(imageData, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        
        const text = result.data.text.trim();
        if (text) {
          setExtractedText(text);
        } else {
          setExtractedText("No text was detected in this image. Try uploading an image with clearer text.");
        }
      } catch (error) {
        console.error("OCR Error:", error);
        setExtractedText("Error processing image. Please try again with a different image.");
      } finally {
        setIsProcessing(false);
        setProgress(100);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    setExtractedText("");
    setProgress(0);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAsNote = () => {
    const params = new URLSearchParams({
      content: extractedText,
      title: "Extracted from Image",
    });
    router.push(`/notes/new?${params.toString()}`);
  };

  return (
    <div className="p-8">
      <div className="mb-10">
        <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-3">Extract Text from Images</h2>
        <p className="text-[#808080] font-light max-w-2xl">
          Upload any image and extract all text content instantly. Perfect for documents, screenshots, handwritten notes, and more.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl">
        <div className="premium-feature-card p-6">
          <h3 className="text-lg font-light text-[#e4e4e7] mb-6 tracking-wide flex items-center gap-3">
            <svg className="w-5 h-5 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Image
          </h3>

          {!image ? (
            <motion.div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center ${
                isDragging 
                  ? "border-[#1d4ed8] bg-[#1d4ed8]/5" 
                  : "border-[#2a2a38] hover:border-[#1d4ed8]/50 hover:bg-[#0e0e14]"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="mb-4 inline-flex rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0e0e14] p-6 border border-[#2a2a38]">
                <svg className="w-10 h-10 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-[#e4e4e7] font-light mb-2">Drop image here or click to upload</p>
              <p className="text-sm text-[#606060]">Supports JPG, PNG, GIF, WebP</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-[#2a2a38]">
                <div className="relative w-full h-80 bg-[#0a0a10]">
                  <Image src={image} alt="Uploaded" fill className="object-contain" />
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-[#08080c]/90 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                      <p className="text-[#1d4ed8] text-sm tracking-wide mb-2">Extracting text...</p>
                      <div className="w-48 h-2 rounded-full bg-[#1a1a24] overflow-hidden mx-auto">
                        <div 
                          className="h-full bg-gradient-to-r from-[#1d4ed8] to-[#14b8a6] transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[#606060] text-xs mt-2">{progress}%</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={clearImage}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#1a1a24] text-[#808080] hover:text-[#e4e4e7] hover:bg-[#24242f] transition-all duration-300 text-sm tracking-wide disabled:opacity-50"
              >
                Upload Different Image
              </button>
            </div>
          )}

          <div className="mt-8 grid gap-3">
            <div className="flex items-center gap-3 text-[#808080]">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-light">Printed text recognition</span>
            </div>
            <div className="flex items-center gap-3 text-[#808080]">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-light">Multi-language support</span>
            </div>
            <div className="flex items-center gap-3 text-[#808080]">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-light">Browser-based processing</span>
            </div>
          </div>
        </div>

        <div className="premium-feature-card p-6">
          <h3 className="text-lg font-light text-[#e4e4e7] mb-6 tracking-wide flex items-center gap-3">
            <svg className="w-5 h-5 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Extracted Text
          </h3>

          {extractedText ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0a0a10] border border-[#1a1a24] min-h-[300px] max-h-[400px] overflow-y-auto">
                <pre className="text-[#c8c4bb] font-light whitespace-pre-wrap text-sm leading-relaxed">{extractedText}</pre>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0f766e] text-[#08080c] font-semibold tracking-wide uppercase text-sm hover:shadow-lg hover:shadow-[#1d4ed8]/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Copy Text"
                  )}
                </button>
                <button 
                  onClick={saveAsNote}
                  className="flex-1 py-3 rounded-xl bg-[#1a1a24] text-[#e4e4e7] font-medium tracking-wide text-sm hover:bg-[#24242f] transition-all duration-300 border border-[#2a2a38]"
                >
                  Save as Note
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0e0e14] p-8 border border-[#2a2a38]">
                <svg className="w-12 h-12 text-[#404050]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-light text-[#606060] mb-2">No text extracted yet</h4>
              <p className="text-sm text-[#404050] max-w-xs">Upload an image to extract text content</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 max-w-4xl">
        <h3 className="text-xl font-light text-[#e4e4e7] mb-8 tracking-wide">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Upload", desc: "Drag and drop or click to upload any image containing text" },
            { step: "02", title: "Process", desc: "Text is extracted from the image using OCR technology" },
            { step: "03", title: "Export", desc: "Copy the text or save it directly as a note in your collection" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-xl bg-[#0e0e14] border border-[#1a1a24]"
            >
              <span className="text-3xl font-light text-[#1d4ed8]/30">{item.step}</span>
              <h4 className="text-lg font-light text-[#e4e4e7] mt-2 mb-2">{item.title}</h4>
              <p className="text-sm text-[#606060] font-light">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
