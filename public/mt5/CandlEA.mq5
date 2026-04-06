//+------------------------------------------------------------------+
//|                                                     CandlEA.mq5  |
//|                              Candl. Trade Sharing Expert Advisor  |
//|                                    https://trade-flow-lac.vercel.app |
//+------------------------------------------------------------------+
//
//  SETUP INSTRUCTIONS
//  ─────────────────────────────────────────────────────────────────
//  1. In MT5: File → Open Data Folder → MQL5 → Experts
//     Paste this file into the Experts folder.
//
//  2. In MT5: Tools → Options → Expert Advisors tab
//     Check "Allow WebRequest for listed URL"
//     Add: https://trade-flow-lac.vercel.app
//
//  3. Restart MT5 or press F5 to refresh the Navigator panel.
//
//  4. Drag CandlEA onto any chart (it runs silently in the background).
//
//  5. In the EA inputs, set:
//     CandlApiKey = your API key from Candl. Settings → Connections
//
//  6. Click OK. The EA will now send every closed trade to Candl.
//  ─────────────────────────────────────────────────────────────────

#property copyright   "Candl."
#property link        "https://trade-flow-lac.vercel.app"
#property version     "1.00"
#property description "Sends closed trade data to Candl. for social sharing"
#property strict

//--- Input parameters
input string CandlApiKey     = "";            // Your Candl. API key
input string CandlWebhookUrl = "https://trade-flow-lac.vercel.app/api/mt5/trade"; // Webhook URL
input bool   ShareOnOpen     = false;         // Also notify on trade open
input bool   DebugMode       = false;         // Print debug logs to Experts tab

//--- Constants
#define RETRY_DELAY_MS 5000

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   if(CandlApiKey == "")
   {
      Alert("CandlEA: API key is not set. Please enter your Candl. API key in the EA inputs.");
      return INIT_PARAMETERS_INCORRECT;
   }

   if(DebugMode)
      Print("CandlEA initialized. Webhook: ", CandlWebhookUrl);

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| OnTradeTransaction — fires on every account transaction           |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest     &request,
                        const MqlTradeResult      &result)
{
   // Only care about deal additions
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD)
      return;

   ulong dealTicket = trans.deal;
   if(dealTicket == 0)
      return;

   // Load the deal into history
   if(!HistoryDealSelect(dealTicket))
   {
      if(DebugMode)
         Print("CandlEA: HistoryDealSelect failed for ticket ", dealTicket);
      return;
   }

   ENUM_DEAL_ENTRY dealEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);

   //--- Handle CLOSED trade
   if(dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_OUT_BY)
   {
      SendClosedTrade(dealTicket);
      return;
   }

   //--- Handle OPENED trade (optional)
   if(ShareOnOpen && dealEntry == DEAL_ENTRY_IN)
   {
      SendOpenedTrade(dealTicket);
   }
}

//+------------------------------------------------------------------+
//| Build and send payload for a CLOSED trade                         |
//+------------------------------------------------------------------+
void SendClosedTrade(ulong dealTicket)
{
   // Gather deal data
   long       ticket      = (long)dealTicket;
   string     symbol      = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
   double     volume      = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
   double     exitPrice   = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
   double     profit      = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
   double     commission  = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   double     swap        = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
   double     netProfit   = profit + commission + swap;
   long       magic       = HistoryDealGetInteger(dealTicket, DEAL_MAGIC);
   string     comment     = HistoryDealGetString(dealTicket, DEAL_COMMENT);
   datetime   closeTime   = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);

   // Determine direction
   ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
   string direction = (dealType == DEAL_TYPE_BUY) ? "long" : "short";

   // Find the matching opening deal to get entry price, SL, TP, open time
   double   entryPrice  = 0;
   double   sl          = 0;
   double   tp          = 0;
   datetime openTime    = 0;
   long     posDuration = 0;

   ulong posId = (ulong)HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
   if(posId != 0)
   {
      // Load full history for this position
      if(HistorySelectByPosition(posId))
      {
         int totalDeals = HistoryDealsTotal();
         for(int i = 0; i < totalDeals; i++)
         {
            ulong hDeal = HistoryDealGetTicket(i);
            ENUM_DEAL_ENTRY hEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(hDeal, DEAL_ENTRY);
            if(hEntry == DEAL_ENTRY_IN)
            {
               entryPrice = HistoryDealGetDouble(hDeal, DEAL_PRICE);
               openTime   = (datetime)HistoryDealGetInteger(hDeal, DEAL_TIME);
               break;
            }
         }
      }
   }

   // Try to get SL/TP from the current or closed position
   // For closed positions we look them up via position history
   if(posId != 0)
   {
      ulong historyPos = HistoryOrderGetTicket(0); // fallback
      // Walk orders for this position
      if(HistorySelectByPosition(posId))
      {
         int totalOrders = HistoryOrdersTotal();
         for(int i = 0; i < totalOrders; i++)
         {
            ulong hOrder = HistoryOrderGetTicket(i);
            if(hOrder != 0)
            {
               sl = HistoryOrderGetDouble(hOrder, ORDER_SL);
               tp = HistoryOrderGetDouble(hOrder, ORDER_TP);
               if(sl != 0 || tp != 0) break;
            }
         }
      }
   }

   // Calculate duration in seconds
   if(openTime > 0 && closeTime > 0)
      posDuration = (long)(closeTime - openTime);

   // Format datetimes as ISO 8601 UTC
   string openTimeStr  = openTime  > 0 ? FormatISOTime(openTime)  : "";
   string closeTimeStr = closeTime > 0 ? FormatISOTime(closeTime) : "";

   // Build JSON payload
   string payload = "{";
   payload += "\"event\":\"trade_closed\",";
   payload += "\"api_key\":\"" + CandlApiKey + "\",";
   payload += "\"trade\":{";
   payload += "\"ticket\":"            + IntegerToString(ticket)          + ",";
   payload += "\"symbol\":\""          + symbol                           + "\",";
   payload += "\"direction\":\""       + direction                        + "\",";
   payload += "\"volume\":"            + DoubleToString(volume, 2)        + ",";
   payload += "\"entry_price\":"       + DoubleToString(entryPrice, 5)    + ",";
   payload += "\"exit_price\":"        + DoubleToString(exitPrice, 5)     + ",";
   payload += "\"sl\":"                + DoubleToString(sl, 5)            + ",";
   payload += "\"tp\":"                + DoubleToString(tp, 5)            + ",";
   payload += "\"profit\":"            + DoubleToString(profit, 2)        + ",";
   payload += "\"commission\":"        + DoubleToString(commission, 2)    + ",";
   payload += "\"swap\":"              + DoubleToString(swap, 2)          + ",";
   payload += "\"net_profit\":"        + DoubleToString(netProfit, 2)     + ",";
   payload += "\"open_time\":\""       + openTimeStr                      + "\",";
   payload += "\"close_time\":\""      + closeTimeStr                     + "\",";
   payload += "\"duration_seconds\":"  + IntegerToString(posDuration)     + ",";
   payload += "\"magic_number\":"      + IntegerToString(magic)           + ",";
   payload += "\"comment\":\""         + EscapeJson(comment)              + "\"";
   payload += "}}";

   if(DebugMode)
      Print("CandlEA [CLOSE] Payload: ", payload);

   bool sent = SendWebhook(payload);
   if(!sent)
   {
      if(DebugMode)
         Print("CandlEA: First attempt failed. Retrying in 5s...");
      Sleep(RETRY_DELAY_MS);
      sent = SendWebhook(payload);
      if(!sent && DebugMode)
         Print("CandlEA: Retry also failed. Trade not shared.");
   }

   if(sent && DebugMode)
      Print("CandlEA: Trade #", ticket, " sent to Candl. successfully.");
}

//+------------------------------------------------------------------+
//| Build and send payload for an OPENED trade                        |
//+------------------------------------------------------------------+
void SendOpenedTrade(ulong dealTicket)
{
   long     ticket     = (long)dealTicket;
   string   symbol     = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
   double   volume     = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
   double   entryPrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
   datetime openTime   = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);

   ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
   string direction = (dealType == DEAL_TYPE_BUY) ? "long" : "short";

   // Get SL/TP from the live position
   double sl = 0, tp = 0;
   ulong posId = (ulong)HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
   if(posId != 0)
   {
      for(int i = 0; i < PositionsTotal(); i++)
      {
         if(PositionGetTicket(i) == posId)
         {
            sl = PositionGetDouble(POSITION_SL);
            tp = PositionGetDouble(POSITION_TP);
            break;
         }
      }
   }

   string openTimeStr = FormatISOTime(openTime);

   string payload = "{";
   payload += "\"event\":\"trade_opened\",";
   payload += "\"api_key\":\"" + CandlApiKey + "\",";
   payload += "\"trade\":{";
   payload += "\"ticket\":"       + IntegerToString(ticket)       + ",";
   payload += "\"symbol\":\""     + symbol                        + "\",";
   payload += "\"direction\":\""  + direction                     + "\",";
   payload += "\"volume\":"       + DoubleToString(volume, 2)     + ",";
   payload += "\"entry_price\":"  + DoubleToString(entryPrice, 5) + ",";
   payload += "\"sl\":"           + DoubleToString(sl, 5)         + ",";
   payload += "\"tp\":"           + DoubleToString(tp, 5)         + ",";
   payload += "\"open_time\":\""  + openTimeStr                   + "\"";
   payload += "}}";

   if(DebugMode)
      Print("CandlEA [OPEN] Payload: ", payload);

   bool sent = SendWebhook(payload);
   if(!sent)
   {
      Sleep(RETRY_DELAY_MS);
      SendWebhook(payload);
   }
}

//+------------------------------------------------------------------+
//| HTTP POST to the Candl. webhook                                   |
//+------------------------------------------------------------------+
bool SendWebhook(string &payload)
{
   string headers = "Content-Type: application/json\r\n";
   char   postData[];
   char   responseData[];
   string responseHeaders;

   StringToCharArray(payload, postData, 0, StringLen(payload));

   int res = WebRequest(
      "POST",
      CandlWebhookUrl,
      headers,
      5000,          // timeout ms
      postData,
      responseData,
      responseHeaders
   );

   if(res == -1)
   {
      int err = GetLastError();
      if(DebugMode)
         Print("CandlEA: WebRequest error ", err,
               ". Make sure the URL is whitelisted in Tools > Options > Expert Advisors.");
      return false;
   }

   if(DebugMode)
   {
      string responseStr = CharArrayToString(responseData);
      Print("CandlEA: Response HTTP ", res, " | ", responseStr);
   }

   return (res >= 200 && res < 300);
}

//+------------------------------------------------------------------+
//| Format a datetime as ISO 8601 UTC string                          |
//+------------------------------------------------------------------+
string FormatISOTime(datetime dt)
{
   MqlDateTime mdt;
   TimeToStruct(dt, mdt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       mdt.year, mdt.mon, mdt.day,
                       mdt.hour, mdt.min, mdt.sec);
}

//+------------------------------------------------------------------+
//| Escape special characters for JSON strings                        |
//+------------------------------------------------------------------+
string EscapeJson(string &s)
{
   string result = s;
   StringReplace(result, "\\", "\\\\");
   StringReplace(result, "\"", "\\\"");
   StringReplace(result, "\n", "\\n");
   StringReplace(result, "\r", "\\r");
   StringReplace(result, "\t", "\\t");
   return result;
}

//+------------------------------------------------------------------+
//| Deinitialization                                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(DebugMode)
      Print("CandlEA deinitialized. Reason: ", reason);
}
