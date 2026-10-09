package com.dahshah.calculator;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.ContactsContract;
import com.getcapacitor.JSArray;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.os.Environment;
import android.os.Build;
import android.content.ContentValues;
import android.net.Uri;
import android.provider.MediaStore;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.util.Date;
import java.text.SimpleDateFormat;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "LocalContacts",
    permissions = {
        @Permission(
            alias = "contacts",
            strings = { Manifest.permission.READ_CONTACTS }
        )
    }
)
public class LocalContactsPlugin extends Plugin {

    @PluginMethod
    public void getLocalAndSimContacts(PluginCall call) {
        if (getPermissionState("contacts") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("contacts", call, "contactsCallback");
            return;
        }
        fetchContacts(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void contactsCallback(PluginCall call) {
        if (getPermissionState("contacts") == com.getcapacitor.PermissionState.GRANTED) {
            fetchContacts(call);
        } else {
            call.reject("Permission denied to read contacts");
        }
    }

    private void fetchContacts(PluginCall call) {
        JSArray contactsArr = new JSArray();
        ContentResolver cr = getContext().getContentResolver();

        String[] projection = new String[] {
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.RAW_CONTACT_ID
        };

        Cursor cursor = cr.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            projection,
            null,
            null,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        );

        if (cursor != null) {
            try {
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int rawIdIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.RAW_CONTACT_ID);

                while (cursor.moveToNext()) {
                    String name = cursor.getString(nameIndex);
                    String number = cursor.getString(numberIndex);
                    long rawId = cursor.getLong(rawIdIndex);

                    boolean isLocalOrSim = true;
                    Cursor rawCursor = cr.query(
                        ContactsContract.RawContacts.CONTENT_URI,
                        new String[] { ContactsContract.RawContacts.ACCOUNT_TYPE },
                        ContactsContract.RawContacts._ID + " = ?",
                        new String[] { String.valueOf(rawId) },
                        null
                    );
                    if (rawCursor != null) {
                        try {
                            if (rawCursor.moveToFirst()) {
                                String accountType = rawCursor.getString(0);
                                if (accountType != null) {
                                    String lower = accountType.toLowerCase();
                                    if (lower.contains("google") || lower.contains("whatsapp") || 
                                        lower.contains("facebook") || lower.contains("telegram") || 
                                        lower.contains("exchange") || lower.contains("cloud") ||
                                        lower.contains("skype") || lower.contains("outlook") ||
                                        lower.contains("hotmail")) {
                                        isLocalOrSim = false;
                                    }
                                }
                            }
                        } finally {
                            rawCursor.close();
                        }
                    }

                    if (isLocalOrSim && name != null && number != null) {
                        JSObject c = new JSObject();
                        c.put("name", name);
                        c.put("phone", number);
                        contactsArr.put(c);
                    }
                }
            } finally {
                cursor.close();
            }
        }

        JSObject result = new JSObject();
        result.put("contacts", contactsArr);
        call.resolve(result);
    }

    @PluginMethod
    public void generatePdfReport(PluginCall call) {
        String reportType = call.getString("reportType", "weekly");
        String startDate = call.getString("startDate", "");
        String endDate = call.getString("endDate", "");
        String distributorName = call.getString("distributorName", "حاسبتي");
        String networkName = call.getString("networkName", "شبكة البراق");
        
        JSArray cardSales = call.getArray("cardSales");
        JSArray groceriesPerformance = call.getArray("groceriesPerformance");
        JSArray newGroceries = call.getArray("newGroceries");
        JSArray inactiveGroceries = call.getArray("inactiveGroceries");
        JSObject financials = call.getObject("financials");

        if (financials == null) {
            financials = new JSObject();
        }

        PdfDocument document = new PdfDocument();
        String currentTimestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

        try {
            // ==========================================
            // PAGE 1: Card Sales Summary (ملخص مبيعات الكروت)
            // ==========================================
            PdfDocument.PageInfo pageInfo1 = new PdfDocument.PageInfo.Builder(595, 842, 1).create();
            PdfDocument.Page page1 = document.startPage(pageInfo1);
            Canvas canvas1 = page1.getCanvas();

            // Background & Double Borders
            canvas1.drawColor(Color.WHITE);
            Paint paint = new Paint();
            paint.setAntiAlias(true);
            
            paint.setColor(Color.rgb(15, 23, 42)); // Slate 900
            paint.setStrokeWidth(2.5f);
            paint.setStyle(Paint.Style.STROKE);
            canvas1.drawRect(20, 20, 575, 822, paint);

            paint.setColor(Color.rgb(100, 116, 139)); // Slate 500
            paint.setStrokeWidth(0.5f);
            canvas1.drawRect(25, 25, 570, 817, paint);

            paint.setStyle(Paint.Style.FILL);

            // Title block
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(20);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.CENTER);
            String titleText = "تقرير مبيعات الكروت الموحد - " + (reportType.equals("weekly") ? "أسبوعي" : "شهري");
            canvas1.drawText(titleText, 595 / 2, 70, paint);

            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setColor(Color.rgb(51, 65, 85));
            canvas1.drawText("الموزع المعتمد: " + distributorName + "  |  اسم الشبكة: " + networkName, 595 / 2, 95, paint);

            paint.setTextSize(9);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(100, 116, 139));
            String dateRangeText = "الفترة الزمنية: من " + startDate + " إلى " + endDate + "  |  تاريخ الطباعة: " + currentTimestamp;
            canvas1.drawText(dateRangeText, 595 / 2, 115, paint);

            // Separator
            paint.setColor(Color.rgb(203, 213, 225));
            paint.setStrokeWidth(1.2f);
            canvas1.drawLine(35, 130, 560, 130, paint);

            // Card Sales Table
            float tableY = 155;
            paint.setColor(Color.rgb(241, 245, 249)); // Header bg
            canvas1.drawRect(35, tableY, 560, tableY + 30, paint);

            paint.setColor(Color.rgb(148, 163, 184)); // Border
            paint.setStrokeWidth(1);
            paint.setStyle(Paint.Style.STROKE);
            canvas1.drawRect(35, tableY, 560, tableY + 30, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(10);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));

            // Right column headers
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas1.drawText("فئة الكرت الكلية", 540, tableY + 19, paint);
            paint.setTextAlign(Paint.Align.CENTER);
            canvas1.drawText("الكمية المباعة (كرت)", 297, tableY + 19, paint);
            paint.setTextAlign(Paint.Align.LEFT);
            canvas1.drawText("إجمالي المبيعات (ريال)", 55, tableY + 19, paint);

            float currentY = tableY + 30;
            float rowHeight = 32;
            long totalQty = 0;
            long totalRev = 0;

            if (cardSales != null) {
                for (int i = 0; i < cardSales.length(); i++) {
                    JSONObject item = cardSales.getJSONObject(i);
                    String label = item.getString("label");
                    long qty = item.getLong("quantity");
                    long total = item.getLong("total");
                    
                    totalQty += qty;
                    totalRev += total;
                    
                    if (i % 2 == 1) {
                        paint.setColor(Color.rgb(248, 250, 252));
                        canvas1.drawRect(35, currentY, 560, currentY + rowHeight, paint);
                    }
                    
                    paint.setColor(Color.rgb(226, 232, 240));
                    paint.setStrokeWidth(0.5f);
                    canvas1.drawLine(35, currentY + rowHeight, 560, currentY + rowHeight, paint);
                    
                    paint.setStyle(Paint.Style.FILL);
                    paint.setColor(Color.rgb(15, 23, 42));
                    paint.setTextSize(10);
                    paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
                    
                    paint.setTextAlign(Paint.Align.RIGHT);
                    canvas1.drawText(label, 540, currentY + 20, paint);
                    
                    paint.setTextAlign(Paint.Align.CENTER);
                    canvas1.drawText(String.valueOf(qty), 297, currentY + 20, paint);
                    
                    paint.setTextAlign(Paint.Align.LEFT);
                    canvas1.drawText(String.format("%,d ريال", total), 55, currentY + 20, paint);
                    
                    currentY += rowHeight;
                }
            }

            // Totals Row Page 1
            paint.setColor(Color.rgb(241, 245, 249));
            canvas1.drawRect(35, currentY, 560, currentY + 35, paint);

            paint.setColor(Color.rgb(71, 85, 105));
            paint.setStrokeWidth(1);
            paint.setStyle(Paint.Style.STROKE);
            canvas1.drawRect(35, currentY, 560, currentY + 35, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));

            paint.setTextAlign(Paint.Align.RIGHT);
            canvas1.drawText("الإجـمـالـي العـام لكروت الفترة:", 540, currentY + 22, paint);

            paint.setTextAlign(Paint.Align.CENTER);
            canvas1.drawText(String.valueOf(totalQty), 297, currentY + 22, paint);

            paint.setTextAlign(Paint.Align.LEFT);
            canvas1.drawText(String.format("%,d ريال", totalRev), 55, currentY + 22, paint);

            // Footer Page 1
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTextSize(8);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(148, 163, 184));
            canvas1.drawText("صفحة 1 من 3", 595 / 2, 805, paint);

            document.finishPage(page1);

            // ==========================================
            // PAGE 2: Detailed Grocery Performance Table
            // ==========================================
            PdfDocument.PageInfo pageInfo2 = new PdfDocument.PageInfo.Builder(595, 842, 2).create();
            PdfDocument.Page page2 = document.startPage(pageInfo2);
            Canvas canvas2 = page2.getCanvas();

            canvas2.drawColor(Color.WHITE);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setStrokeWidth(2.5f);
            paint.setStyle(Paint.Style.STROKE);
            canvas2.drawRect(20, 20, 575, 822, paint);

            paint.setColor(Color.rgb(100, 116, 139));
            paint.setStrokeWidth(0.5f);
            canvas2.drawRect(25, 25, 570, 817, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(18);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.CENTER);
            canvas2.drawText("جدول أداء البقالات والعملاء التفصيلي", 595 / 2, 70, paint);

            paint.setTextSize(9);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(100, 116, 139));
            canvas2.drawText("الفترة الزمنية: من " + startDate + " إلى " + endDate + "  |  مرتبة تنازلياً حسب قيمة المبيعات المباشرة للعميل", 595 / 2, 90, paint);

            // Separator
            paint.setColor(Color.rgb(203, 213, 225));
            paint.setStrokeWidth(1.2f);
            canvas2.drawLine(35, 105, 560, 105, paint);

            // Table Headers
            float table2Y = 120;
            paint.setColor(Color.rgb(241, 245, 249));
            canvas2.drawRect(35, table2Y, 560, table2Y + 28, paint);

            paint.setColor(Color.rgb(148, 163, 184));
            paint.setStrokeWidth(1);
            paint.setStyle(Paint.Style.STROKE);
            canvas2.drawRect(35, table2Y, 560, table2Y + 28, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(9);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));

            // Columns layout (RTL alignment)
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas2.drawText("اسم البقالة / العميل", 545, table2Y + 18, paint);

            paint.setTextAlign(Paint.Align.CENTER);
            canvas2.drawText("100", 370, table2Y + 18, paint);
            canvas2.drawText("200", 320, table2Y + 18, paint);
            canvas2.drawText("250", 270, table2Y + 18, paint);
            canvas2.drawText("300", 220, table2Y + 18, paint);
            canvas2.drawText("500", 170, table2Y + 18, paint);

            paint.setTextAlign(Paint.Align.LEFT);
            canvas2.drawText("المبلغ الإجمالي", 50, table2Y + 18, paint);

            float current2Y = table2Y + 28;
            float row2Height = 24;

            long sum100 = 0, sum200 = 0, sum250 = 0, sum300 = 0, sum500 = 0, sumTotal = 0;

            if (groceriesPerformance != null) {
                for (int i = 0; i < groceriesPerformance.length(); i++) {
                    if (current2Y > 750) {
                        paint.setColor(Color.rgb(100, 116, 139));
                        paint.setTextSize(8);
                        paint.setTextAlign(Paint.Align.CENTER);
                        paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
                        canvas2.drawText("... وتوجد بقالات أخرى نشطة مسجلة بالنظام ومحفوظة ...", 595 / 2, 755, paint);
                        break;
                    }

                    JSONObject item = groceriesPerformance.getJSONObject(i);
                    String name = item.getString("name");
                    boolean isPro = item.optBoolean("isPro", false);
                    long q100 = item.optLong("q100", 0);
                    long q200 = item.optLong("q200", 0);
                    long q250 = item.optLong("q250", 0);
                    long q300 = item.optLong("q300", 0);
                    long q500 = item.optLong("q500", 0);
                    long total = item.optLong("total", 0);

                    sum100 += q100;
                    sum200 += q200;
                    sum250 += q250;
                    sum300 += q300;
                    sum500 += q500;
                    sumTotal += total;

                    if (i % 2 == 1) {
                        paint.setColor(Color.rgb(248, 250, 252));
                        canvas2.drawRect(35, current2Y, 560, current2Y + row2Height, paint);
                    }

                    paint.setColor(Color.rgb(226, 232, 240));
                    paint.setStrokeWidth(0.5f);
                    canvas2.drawLine(35, current2Y + row2Height, 560, current2Y + row2Height, paint);

                    paint.setStyle(Paint.Style.FILL);
                    paint.setColor(Color.rgb(15, 23, 42));
                    paint.setTextSize(9);

                    paint.setTextAlign(Paint.Align.RIGHT);
                    if (isPro) {
                        paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
                        canvas2.drawText("⭐ " + name + " [PRO]", 545, current2Y + 16, paint);
                    } else {
                        paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
                        canvas2.drawText(name, 545, current2Y + 16, paint);
                    }

                    paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
                    paint.setTextAlign(Paint.Align.CENTER);
                    canvas2.drawText(q100 > 0 ? String.valueOf(q100) : "-", 370, current2Y + 16, paint);
                    canvas2.drawText(q200 > 0 ? String.valueOf(q200) : "-", 320, current2Y + 16, paint);
                    canvas2.drawText(q250 > 0 ? String.valueOf(q250) : "-", 270, current2Y + 16, paint);
                    canvas2.drawText(q300 > 0 ? String.valueOf(q300) : "-", 220, current2Y + 16, paint);
                    canvas2.drawText(q500 > 0 ? String.valueOf(q500) : "-", 170, current2Y + 16, paint);

                    paint.setTextAlign(Paint.Align.LEFT);
                    paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
                    canvas2.drawText(String.format("%,d ريال", total), 50, current2Y + 16, paint);

                    current2Y += row2Height;
                }
            }

            // Totals Row Page 2
            paint.setColor(Color.rgb(241, 245, 249));
            canvas2.drawRect(35, current2Y, 560, current2Y + 30, paint);

            paint.setColor(Color.rgb(71, 85, 105));
            paint.setStrokeWidth(1);
            paint.setStyle(Paint.Style.STROKE);
            canvas2.drawRect(35, current2Y, 560, current2Y + 30, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(9);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));

            paint.setTextAlign(Paint.Align.RIGHT);
            canvas2.drawText("إجمالي المسحوبات للبقالات:", 545, current2Y + 18, paint);

            paint.setTextAlign(Paint.Align.CENTER);
            canvas2.drawText(String.valueOf(sum100), 370, current2Y + 18, paint);
            canvas2.drawText(String.valueOf(sum200), 320, current2Y + 18, paint);
            canvas2.drawText(String.valueOf(sum250), 270, current2Y + 18, paint);
            canvas2.drawText(String.valueOf(sum300), 220, current2Y + 18, paint);
            canvas2.drawText(String.valueOf(sum500), 170, current2Y + 18, paint);

            paint.setTextAlign(Paint.Align.LEFT);
            canvas2.drawText(String.format("%,d ريال", sumTotal), 50, current2Y + 18, paint);

            // Footer Page 2
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTextSize(8);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(148, 163, 184));
            canvas2.drawText("صفحة 2 من 3", 595 / 2, 805, paint);

            document.finishPage(page2);

            // ==========================================
            // PAGE 3: Insights & Financial Metrics Dashboard
            // ==========================================
            PdfDocument.PageInfo pageInfo3 = new PdfDocument.PageInfo.Builder(595, 842, 3).create();
            PdfDocument.Page page3 = document.startPage(pageInfo3);
            Canvas canvas3 = page3.getCanvas();

            canvas3.drawColor(Color.WHITE);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setStrokeWidth(2.5f);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(20, 20, 575, 822, paint);

            paint.setColor(Color.rgb(100, 116, 139));
            paint.setStrokeWidth(0.5f);
            canvas3.drawRect(25, 25, 570, 817, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(18);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.CENTER);
            canvas3.drawText("لوحة المؤشرات والتحليلات والمالية العامة", 595 / 2, 70, paint);

            paint.setTextSize(9);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(100, 116, 139));
            canvas3.drawText("الفترة الزمنية: من " + startDate + " إلى " + endDate + "  |  تحليلات الركود والتأسيس ومؤشرات الكفاءة", 595 / 2, 90, paint);

            // Separator
            paint.setColor(Color.rgb(203, 213, 225));
            paint.setStrokeWidth(1.2f);
            canvas3.drawLine(35, 105, 560, 105, paint);

            // 1. New Groceries Box
            float sec1Y = 120;
            paint.setColor(Color.rgb(248, 250, 252));
            canvas3.drawRect(35, sec1Y, 560, sec1Y + 130, paint);
            paint.setColor(Color.rgb(226, 232, 240));
            paint.setStrokeWidth(1);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(35, sec1Y, 560, sec1Y + 130, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(37, 99, 235)); // Blue 600
            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas3.drawText("✨ البقالات والعملاء المشتركون حديثاً في الفترة (العملاء الجدد):", 545, sec1Y + 22, paint);

            paint.setTextSize(10);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(51, 65, 85));

            float item1Y = sec1Y + 45;
            if (newGroceries == null || newGroceries.length() == 0) {
                canvas3.drawText("لم يتم رصد أو تسجيل أي بقالات جديدة في هذا النطاق الزمني.", 545, item1Y, paint);
            } else {
                for (int i = 0; i < newGroceries.length() && i < 4; i++) {
                    canvas3.drawText("• " + newGroceries.getString(i) + " (تم تأسيس الحساب وبدء النشاط)", 545, item1Y, paint);
                    item1Y += 20;
                }
            }

            // 2. Inactive Groceries Box
            float sec2Y = 265;
            paint.setColor(Color.rgb(254, 242, 242)); // Light red
            canvas3.drawRect(35, sec2Y, 560, sec2Y + 140, paint);
            paint.setColor(Color.rgb(252, 165, 165));
            paint.setStrokeWidth(1);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(35, sec2Y, 560, sec2Y + 140, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(220, 38, 38)); // Red 600
            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas3.drawText("⚠️ تنبيهات الركود (بقالات بدون فواتير أو سداد منذ 5 أيام أو أكثر):", 545, sec2Y + 22, paint);

            paint.setTextSize(10);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(51, 65, 85));

            float item2Y = sec2Y + 45;
            if (inactiveGroceries == null || inactiveGroceries.length() == 0) {
                paint.setColor(Color.rgb(22, 163, 74)); // Green 600
                canvas3.drawText("رائع! لا يوجد أي ركود، كل البقالات والعملاء لديهم عمليات مستمرة.", 545, item2Y, paint);
            } else {
                for (int i = 0; i < inactiveGroceries.length() && i < 4; i++) {
                    canvas3.drawText("• " + inactiveGroceries.getString(i), 545, item2Y, paint);
                    item2Y += 20;
                }
            }

            // 3. Financial Summary Box (Total Sales, Total Collected, Total Debt)
            float sec3Y = 420;
            paint.setColor(Color.rgb(241, 245, 249)); // Slate 100 bg
            canvas3.drawRect(35, sec3Y, 560, sec3Y + 310, paint);
            paint.setColor(Color.rgb(71, 85, 105)); // Slate 600 border
            paint.setStrokeWidth(1.2f);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(35, sec3Y, 560, sec3Y + 310, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(15, 23, 42));
            paint.setTextSize(13);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas3.drawText("📊 الملخص المالي والتحليلي العام للفترة:", 545, sec3Y + 28, paint);

            long totalSales = financials.optLong("totalSales", 0);
            long totalCollected = financials.optLong("totalCollected", 0);
            long totalDebt = financials.optLong("totalDebt", 0);

            // Total Sales Sub-Card
            float subCardY = sec3Y + 50;
            paint.setColor(Color.WHITE);
            canvas3.drawRect(55, subCardY, 540, subCardY + 65, paint);
            paint.setColor(Color.rgb(203, 213, 225));
            paint.setStrokeWidth(0.8f);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(55, subCardY, 540, subCardY + 65, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(30, 41, 59));
            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas3.drawText("إجمالي قيمة المبيعات خلال الفترة (ريال يمني)", 525, subCardY + 24, paint);
            paint.setColor(Color.rgb(37, 99, 235)); // Blue 600
            paint.setTextSize(18);
            paint.setTextAlign(Paint.Align.LEFT);
            canvas3.drawText(String.format("%,d ريال", totalSales), 75, subCardY + 44, paint);

            // Total Collected Sub-Card
            subCardY += 75;
            paint.setColor(Color.WHITE);
            paint.setStyle(Paint.Style.FILL);
            canvas3.drawRect(55, subCardY, 540, subCardY + 65, paint);
            paint.setColor(Color.rgb(203, 213, 225));
            paint.setStrokeWidth(0.8f);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(55, subCardY, 540, subCardY + 65, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(30, 41, 59));
            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas3.drawText("إجمالي المبالغ المحصلة والمقبوضة (سداد فوري + آجل)", 525, subCardY + 24, paint);
            paint.setColor(Color.rgb(22, 163, 74)); // Green 600
            paint.setTextSize(18);
            paint.setTextAlign(Paint.Align.LEFT);
            canvas3.drawText(String.format("%,d ريال", totalCollected), 75, subCardY + 44, paint);

            // Total Debt Sub-Card
            subCardY += 75;
            paint.setColor(Color.WHITE);
            paint.setStyle(Paint.Style.FILL);
            canvas3.drawRect(55, subCardY, 540, subCardY + 65, paint);
            paint.setColor(Color.rgb(203, 213, 225));
            paint.setStrokeWidth(0.8f);
            paint.setStyle(Paint.Style.STROKE);
            canvas3.drawRect(55, subCardY, 540, subCardY + 65, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.rgb(30, 41, 59));
            paint.setTextSize(11);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas3.drawText("إجمالي المديونية الجديدة المستحقة للفترة", 525, subCardY + 24, paint);
            paint.setColor(Color.rgb(220, 38, 38)); // Red 600
            paint.setTextSize(18);
            paint.setTextAlign(Paint.Align.LEFT);
            canvas3.drawText(String.format("%,d ريال", totalDebt), 75, subCardY + 44, paint);

            // Footer Page 3
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTextSize(8);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            paint.setColor(Color.rgb(148, 163, 184));
            canvas3.drawText("صفحة 3 من 3", 595 / 2, 805, paint);

            document.finishPage(page3);

            // Save Document to Downloads via Scoped Storage
            String formatName = reportType.equals("weekly") ? "أسبوعي" : "شهري";
            String fileDate = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String fileName = "تقرير_حسابي_" + formatName + "_" + fileDate + ".pdf";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
                if (uri != null) {
                    try (OutputStream outputStream = resolver.openOutputStream(uri)) {
                        document.writeTo(outputStream);
                        JSObject pdfResult = new JSObject();
                        pdfResult.put("success", true);
                        pdfResult.put("fileName", fileName);
                        call.resolve(pdfResult);
                    } catch (IOException e) {
                        resolver.delete(uri, null, null);
                        call.reject("خطأ أثناء كتابة ملف الـ PDF إلى التنزيلات: " + e.getMessage());
                    }
                } else {
                    call.reject("تعذر إدراج سجل MediaStore لملف الـ PDF");
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File pdfFile = new File(downloadsDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(pdfFile)) {
                    document.writeTo(fos);
                    JSObject pdfResult = new JSObject();
                    pdfResult.put("success", true);
                    pdfResult.put("fileName", fileName);
                    call.resolve(pdfResult);
                } catch (IOException e) {
                    call.reject("خطأ في كتابة ملف الـ PDF إلى وحدة التخزين: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            call.reject("فشل توليد التقرير بنجاح: " + e.getMessage());
        } finally {
            document.close();
        }
    }
}
