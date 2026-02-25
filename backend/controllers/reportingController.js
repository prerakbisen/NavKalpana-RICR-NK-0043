import reportingService from '../services/reportingService.js';

// Get monthly fitness report
export const getMonthlyReport = async (req, res) => {
  try {
    console.log(`📊 Monthly report requested by user: ${req.user_id}`);
    
    const report = await reportingService.generateMonthlyReport(req.user_id);
    
    console.log(`✅ Monthly report generated successfully for user: ${req.user_id}`);
    
    res.json(report);
  } catch (error) {
    console.error('❌ Get monthly report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate monthly report',
      message: error.message 
    });
  }
};

// Get report summary (lightweight version)
export const getReportSummary = async (req, res) => {
  try {
    console.log(`📊 Report summary requested by user: ${req.user_id}`);
    
    const report = await reportingService.generateMonthlyReport(req.user_id);
    
    // Return only summary data
    const summary = {
      period: report.period,
      summary: report.summary,
      insights: report.insights.filter(i => i.priority === 'high'),
      generated_at: report.generated_at
    };
    
    console.log(`✅ Report summary generated successfully for user: ${req.user_id}`);
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Get report summary error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report summary',
      message: error.message 
    });
  }
};
